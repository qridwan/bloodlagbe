// src/app/api/submissions/donor-lists/[submissionId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    submissionId?: string;
  };
}

// GET handler to fetch a specific submission for pre-filling the revise form
export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const submissionId = params.submissionId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }
  if (!submissionId) {
    return NextResponse.json({ message: 'Submission ID required.' }, { status: 400 });
  }

  try {
    const submission = await prisma.userSubmittedList.findFirst({
      where: {
        id: submissionId,
        submittedByUserId: session.user.id, // Ensure user owns this submission
      },
    });
    if (!submission) {
      return NextResponse.json(
        { message: 'Submission not found or access denied.' },
        { status: 404 }
      );
    }
    return NextResponse.json(submission, { status: 200 });
  } catch (error) {
    console.error('Error fetching submission for revision:', error);
    return NextResponse.json({ message: 'Failed to fetch submission data.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT handler for resubmitting/updating
export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const submissionId = params.submissionId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }
  if (!submissionId) {
    return NextResponse.json({ message: 'Submission ID required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { listName, notes, donorDataJson } = body;

    if (!listName || typeof listName !== 'string' || listName.trim() === '') {
      return NextResponse.json({ message: 'List Name is required.' }, { status: 400 });
    }
    if (!donorDataJson || !Array.isArray(donorDataJson) || donorDataJson.length === 0) {
      return NextResponse.json({ message: 'Donor data is required.' }, { status: 400 });
    }
    // Add deeper validation for donorDataJson items if needed

    // Check if the user owns this submission and if it's in a state that allows revision (e.g., REJECTED)
    const existingSubmission = await prisma.userSubmittedList.findFirst({
      where: {
        id: submissionId,
        submittedByUserId: session.user.id,
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { message: 'Submission not found or you do not have permission to edit it.' },
        { status: 404 }
      );
    }
    if (
      existingSubmission.status !==
      SubmissionStatus.REJECTED /* && existingSubmission.status !== SubmissionStatus.NEEDS_REVISION */
    ) {
      return NextResponse.json(
        {
          message: `This submission (status: ${existingSubmission.status}) cannot be revised at this time.`,
        },
        { status: 403 }
      );
    }

    const updatedSubmission = await prisma.userSubmittedList.update({
      where: {
        id: submissionId,
      },
      data: {
        listName: listName.trim(),
        notes: notes || null,
        donorDataJson: donorDataJson,
        status: SubmissionStatus.PENDING_REVIEW, // Change status back to pending
        submittedAt: new Date(), // Update submission time to now for re-review
        // Clear previous review fields
        reviewedAt: null,
        reviewedByAdminId: null,
        adminNotes: null, // Clear admin notes as it's a new revision
      },
    });

    return NextResponse.json(
      {
        message: 'Submission revised and resubmitted successfully!',
        submission: updatedSubmission,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error resubmitting donor list:', error);
    return NextResponse.json({ message: 'Failed to resubmit donor list.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
