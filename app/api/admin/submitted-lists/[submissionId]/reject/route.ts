// src/app/api/admin/submitted-lists/[submissionId]/reject/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    submissionId?: string;
  };
}

export async function PUT(request: Request, context: RouteContext) {
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
    const body = await request.json();
    const { adminNotes } = body; // Expecting optional: { "adminNotes": "Reason for rejection..." }

    // Find the submission to ensure it exists and is in a rejectable state (e.g., PENDING_REVIEW)
    const existingSubmission = await prisma.userSubmittedList.findUnique({
      where: { id: submissionId },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { message: `Submission with ID ${submissionId} not found.` },
        { status: 404 }
      );
    }

    // Optional: Check if the submission is already processed
    if (existingSubmission.status !== SubmissionStatus.PENDING_REVIEW) {
      // Or allow rejection even if approved if that's a valid business logic (e.g. retract approval)
      // For now, let's assume only PENDING_REVIEW can be rejected.
      return NextResponse.json(
        {
          message: `Submission is not pending review. Current status: ${existingSubmission.status}`,
        },
        { status: 409 }
      ); // Conflict
    }

    const updatedSubmission = await prisma.userSubmittedList.update({
      where: {
        id: submissionId,
      },
      data: {
        status: SubmissionStatus.REJECTED,
        adminNotes: adminNotes || null, // Save notes if provided
        reviewedAt: new Date(),
        reviewedByAdminId: session.user.id,
      },
      include: {
        // Return the updated submission with relevant details
        reviewedByAdmin: { select: { name: true, email: true } },
        submittedByUser: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(
      { message: 'Submission rejected successfully.', submission: updatedSubmission },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error rejecting submission ID ${submissionId}:`, error);
    if (error.code === 'P2025') {
      // Prisma error code for record not found during update
      return NextResponse.json(
        { message: `Submission with ID ${submissionId} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to reject submission. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
