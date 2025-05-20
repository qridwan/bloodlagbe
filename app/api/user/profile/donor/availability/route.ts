// src/app/api/user/profile/donor/availability/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { isAvailable } = body; // Expecting: { "isAvailable": true } or { "isAvailable": false }

    // Validate input
    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid input: "isAvailable" must be a boolean (true or false).' },
        { status: 400 }
      );
    }

    // Find the donor profile linked to the logged-in user
    const existingDonorProfile = await prisma.donor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: { id: true }, // We only need to know if it exists to update it
    });

    if (!existingDonorProfile) {
      return NextResponse.json(
        { message: 'Donor profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Update the availability status
    const updatedDonorProfile = await prisma.donor.update({
      where: {
        userId: session.user.id, // Ensure we're updating the correct user's donor record
      },
      data: {
        isAvailable: isAvailable,
      },
      // Select the fields you want to return, can be minimal
      select: {
        id: true,
        isAvailable: true,
        updatedAt: true, // Good to see when it was last updated
      },
    });

    // await prisma.$disconnect(); // Disconnect in finally
    return NextResponse.json(updatedDonorProfile, { status: 200 });
  } catch (error) {
    console.error('Error updating donor availability:', error);
    // await prisma.$disconnect(); // Disconnect in finally
    return NextResponse.json(
      { message: 'Failed to update availability. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
