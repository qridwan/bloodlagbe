import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    submissionId?: string;
  };
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const submissionId = params.submissionId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!submissionId) {
    return NextResponse.json({ message: 'Submission ID is required.' }, { status: 400 });
  }

  try {
    const submission = await prisma.userSubmittedList.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedByAdmin: {
          // Include details of admin if already reviewed (for consistency)
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { message: `Submission with ID ${submissionId} not found.` },
        { status: 404 }
      );
    }

    // The donorDataJson field will be returned as part of the submission object
    return NextResponse.json(submission, { status: 200 });
  } catch (error) {
    console.error(`Error fetching submission details for ID ${submissionId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch submission details' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
