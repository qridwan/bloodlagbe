import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, Prisma, BloodGroup } from '@prisma/client';

const prisma = new PrismaClient();

// --- GET Handler (already defined) ---
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const donorProfile = await prisma.donor.findUnique({
      where: { userId: session.user.id },
      include: { campus: true, group: true },
    });

    if (!donorProfile) {
      return NextResponse.json(
        { message: 'No donor profile found for this user.' },
        { status: 404 }
      );
    }
    return NextResponse.json(donorProfile, { status: 200 });
  } catch (error) {
    console.error("Error fetching user's donor profile:", error);
    return NextResponse.json(
      { message: 'Failed to fetch donor profile. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); // Disconnect in finally block
  }
}

// --- POST Handler: Create or Update Logged-in User's Donor Profile ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      bloodGroup, // Expecting e.g., "A_POSITIVE"
      contactNumber,
      email, // Optional donor-specific email
      district,
      city,
      campusId, // Now optional
      groupId, // Now optional
      isAvailable,
      tagline,
    } = body;

    // --- Basic Input Validation ---
    if (
      !name ||
      !bloodGroup ||
      !contactNumber ||
      !district ||
      !city ||
      typeof isAvailable !== 'boolean'
    ) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!bloodGroup) missingFields.push('bloodGroup');
      if (!contactNumber) missingFields.push('contactNumber');
      if (!district) missingFields.push('district');
      if (!city) missingFields.push('city');
      if (typeof isAvailable !== 'boolean')
        missingFields.push('isAvailable (must be true or false)');

      return NextResponse.json(
        { message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate bloodGroup enum
    if (!Object.values(BloodGroup).includes(bloodGroup as BloodGroup)) {
      return NextResponse.json({ message: 'Invalid blood group provided.' }, { status: 400 });
    }

    const donorCreateData: Omit<Prisma.DonorCreateInput, 'user'> = {
      name,
      bloodGroup: bloodGroup as BloodGroup,
      contactNumber,
      email: email ?? null,
      district,
      city,
      isAvailable,
      ...(campusId ? { campus: { connect: { id: campusId } } } : {}),
      ...(groupId ? { group: { connect: { id: groupId } } } : {}),
      tagline: tagline ?? null,
    };
    const donorUpdateData: Omit<Prisma.DonorUpdateInput, 'user'> = {
      name,
      bloodGroup: bloodGroup as BloodGroup,
      contactNumber,
      email: email ?? null,
      district,
      city,
      isAvailable,
      campus: campusId ? { connect: { id: campusId } } : { disconnect: true },
      group: groupId ? { connect: { id: groupId } } : { disconnect: true },
      tagline: tagline ?? null,
    };
    const upsertedDonorProfile = await prisma.donor.upsert({
      where: { userId: session.user.id },
      update: donorUpdateData,
      create: {
        ...donorCreateData,
        user: { connect: { id: session.user.id } },
      },
      // include: {
      // 	campus: true,
      // 	group: true,
      // }
    });

    return NextResponse.json(upsertedDonorProfile, { status: 200 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating/updating user's donor profile:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { message: 'Error with related data (e.g., Campus or Group ID not found).' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { message: 'Failed to save donor profile. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
