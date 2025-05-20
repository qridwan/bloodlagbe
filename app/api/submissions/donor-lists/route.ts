// src/app/api/submissions/donor-lists/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

// Define the expected structure of a donor object within the submitted JSON data
// These are the snake_case keys from the user's CSV/frontend table
const EXPECTED_DONOR_KEYS = [
  'name',
  'blood_group',
  'contact_number', // required
  'email',
  'district',
  'city',
  'campus',
  'group',
  'is_available',
  'tagline', // optional or required by context
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: 'Unauthorized. Please log in to submit a list.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      listName,
      notes,
      donorDataJson, // This is expected to be an array of donor objects
    } = body;

    // --- Basic Input Validation ---
    if (!listName || typeof listName !== 'string' || listName.trim() === '') {
      return NextResponse.json({ message: 'List Name is required.' }, { status: 400 });
    }

    if (!donorDataJson || !Array.isArray(donorDataJson) || donorDataJson.length === 0) {
      return NextResponse.json(
        { message: 'Donor data is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // --- Optional: Deeper validation of each donor object in donorDataJson ---
    for (const donor of donorDataJson) {
      if (typeof donor !== 'object' || donor === null) {
        return NextResponse.json(
          { message: 'Invalid format: donorDataJson must be an array of objects.' },
          { status: 400 }
        );
      }
      // Check for essential keys (adjust as per your absolute minimum requirements for a submission)
      if (!donor.name || !donor.blood_group || !donor.contact_number) {
        return NextResponse.json(
          {
            message: `Each donor record must include at least name, blood_group, and contact_number. Found invalid record: ${JSON.stringify(donor)}`,
          },
          { status: 400 }
        );
      }
      // You could add more specific validation here (e.g., blood group format, phone format)
      // but much of this will be part of the admin's review process.
    }

    const newSubmission = await prisma.userSubmittedList.create({
      data: {
        listName: listName.trim(),
        notes: notes || null,
        donorDataJson: donorDataJson, // Prisma handles JSON type directly
        submittedByUserId: session.user.id,
        status: SubmissionStatus.PENDING_REVIEW, // Default status
      },
      // Optionally include the submittedByUser details in the response
      include: {
        submittedByUser: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { message: 'Donor list submitted successfully for review!', submission: newSubmission },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting donor list:', error);
    if (error.name === 'SyntaxError') {
      // JSON parsing error from request.json()
      return NextResponse.json(
        { message: 'Invalid request body format. Expected JSON.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to submit donor list. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
