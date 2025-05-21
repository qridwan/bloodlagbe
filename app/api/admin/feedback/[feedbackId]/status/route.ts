// src/app/api/admin/feedback/[feedbackId]/status/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    feedbackId?: string;
  };
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const feedbackId = params.feedbackId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!feedbackId) {
    return NextResponse.json({ message: 'Feedback ID is required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { isReadByAdmin } = body; // Expecting: { "isReadByAdmin": true } or { "isReadByAdmin": false }

    if (typeof isReadByAdmin !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid input: "isReadByAdmin" must be a boolean.' },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.platformFeedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        isReadByAdmin: isReadByAdmin,
      },
    });

    if (!updatedFeedback) {
      return NextResponse.json(
        { message: `Feedback with ID ${feedbackId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedFeedback, { status: 200 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`Error updating feedback status for ID ${feedbackId}:`, error);
    if (error.code === 'P2025') {
      // Prisma error code for record not found
      return NextResponse.json(
        { message: `Feedback with ID ${feedbackId} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to update feedback status. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
