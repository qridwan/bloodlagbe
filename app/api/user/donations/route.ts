/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- POST Handler (already defined from previous step) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { donationDate, location } = body;

    if (!donationDate) {
      return NextResponse.json(
        { message: "Missing required field: donationDate" },
        { status: 400 }
      );
    }

    let parsedDonationDate;
    try {
      parsedDonationDate = new Date(donationDate);
      if (isNaN(parsedDonationDate.getTime())) {
        throw new Error("Invalid date format");
      }
      if (parsedDonationDate > new Date()) {
        return NextResponse.json(
          { message: "Donation date cannot be in the future." },
          { status: 400 }
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        {
          message:
            e.message ??
            "Invalid donationDate format. Please use ISO 8601 format (e.g., YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }

    const donorProfile = await prisma.donor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!donorProfile) {
      return NextResponse.json(
        {
          message:
            "Donor profile not found. You must have a donor profile to record donations.",
        },
        { status: 404 }
      );
    }

    const newDonation = await prisma.donation.create({
      data: {
        donationDate: parsedDonationDate,
        location: location ?? null,
        donor: { connect: { id: donorProfile.id } },
      },
    });

    return NextResponse.json(newDonation, { status: 201 });
  } catch (error: any) {
    console.error("Error recording donation:", error);
    return NextResponse.json(
      { message: "Failed to record donation. Please try again." },
      { status: 500 }
    );
  } finally {
    // Moved prisma.$disconnect() to be called once if multiple handlers exist,
    // or ensure it's in each handler's finally block if they are truly independent.
    // For separate export functions, each should manage its own disconnect.
    await prisma.$disconnect(); // Will be handled by each function's finally
  }
}

// --- GET Handler: Fetch Logged-in User's Donation History ---
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  try {
    // Find the Donor ID associated with the logged-in user
    const donorProfile = await prisma.donor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: { id: true }, // We only need the donor's ID
    });

    if (!donorProfile) {
      // If no donor profile, they have no donations linked to their user account
      await prisma.$disconnect(); // Disconnect in finally
      return NextResponse.json([], { status: 200 }); // Return empty array
    }

    // Fetch all donations linked to this donor's ID
    const donations = await prisma.donation.findMany({
      where: {
        donorId: donorProfile.id,
      },
      orderBy: {
        donationDate: "desc", // Show most recent donations first
      },
      // Optionally, select specific fields if you don't need the whole Donation object
      // select: { id: true, donationDate: true, location: true, createdAt: true }
    });

    await prisma.$disconnect();
    return NextResponse.json(donations, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching donation history:", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { message: "Failed to fetch donation history. Please try again." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
