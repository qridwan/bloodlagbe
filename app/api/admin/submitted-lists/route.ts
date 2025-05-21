// src/app/api/admin/submitted-lists/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    // Allow filtering by status, default to PENDING_REVIEW
    const statusFilter = searchParams.get('status') as SubmissionStatus | null;

    const whereClause: any = {};
    if (statusFilter && Object.values(SubmissionStatus).includes(statusFilter)) {
      whereClause.status = statusFilter;
    } else {
      whereClause.status = SubmissionStatus.PENDING_REVIEW; // Default to pending
    }

    const submittedLists = await prisma.userSubmittedList.findMany({
      where: whereClause,
      orderBy: {
        submittedAt: 'asc', // Show oldest pending items first
      },
      include: {
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(submittedLists, { status: 200 });
  } catch (error) {
    console.error('Error fetching submitted donor lists:', error);
    return NextResponse.json({ message: 'Failed to fetch submitted donor lists' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
