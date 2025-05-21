/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, FeedbackType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions); // Check if user is logged in

  try {
    const body = await request.json();
    const { feedbackType, message, rating, guestEmail, guestName } = body;

    // Validate required fields
    if (!feedbackType || !message) {
      return NextResponse.json(
        { message: 'Feedback type and message are required.' },
        { status: 400 }
      );
    }
    console.log(body);
    if (!Object.values(FeedbackType).includes(feedbackType as FeedbackType)) {
      return NextResponse.json({ message: 'Invalid feedback type.' }, { status: 400 });
    }

    const dataToCreate: any = {
      feedbackType: feedbackType as FeedbackType,
      message: message,
      rating: rating ? parseInt(rating, 10) : null,
    };

    if (session?.user?.id) {
      dataToCreate.submittedByUserId = session.user.id;
    } else {
      // For guests, email is good to have, name is optional
      if (guestEmail) dataToCreate.guestEmail = guestEmail;
      if (guestName) dataToCreate.guestName = guestName;
    }

    const newFeedback = await prisma.platformFeedback.create({
      data: dataToCreate,
    });

    return NextResponse.json(
      { message: 'Feedback submitted successfully!', feedback: newFeedback },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { message: 'Failed to submit feedback. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
