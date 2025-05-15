import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import { PrismaClient, Prisma, BloodGroup } from '@prisma/client'; // Prisma.BloodGroup is now correctly used

const prisma = new PrismaClient();

// --- GET Handler (already defined) ---
export async function GET(request: Request) {
  // ... your existing GET handler code ...
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const donorProfile = await prisma.donor.findUnique({
      where: { userId: session.user.id },
      include: { campus: true, group: true },
    });

    // await prisma.$disconnect(); // Disconnect should ideally be at the very end or in a finally block if needed per request

    if (!donorProfile) {
      return NextResponse.json({ message: 'No donor profile found for this user.' }, { status: 404 });
    }
    return NextResponse.json(donorProfile, { status: 200 });
  } catch (error) {
    console.error("Error fetching user's donor profile:", error);
    // await prisma.$disconnect();
    return NextResponse.json({ message: "Failed to fetch donor profile. Please try again." }, { status: 500 });
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
      campusId, // Expecting ID from frontend (populated by /api/filters/options)
      groupId,  // Expecting ID from frontend
      isAvailable, // boolean
    } = body;

    // --- Basic Input Validation ---
    if (!name || !bloodGroup || !contactNumber || !district || !city || !campusId || !groupId || typeof isAvailable !== 'boolean') {
      let missingFields = [];
      if (!name) missingFields.push('name');
      if (!bloodGroup) missingFields.push('bloodGroup');
      if (!contactNumber) missingFields.push('contactNumber');
      if (!district) missingFields.push('district');
      if (!city) missingFields.push('city');
      if (!campusId) missingFields.push('campusId');
      if (!groupId) missingFields.push('groupId');
      if (typeof isAvailable !== 'boolean') missingFields.push('isAvailable (must be true or false)');

      return NextResponse.json({ message: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    // Validate bloodGroup enum
    if (!Object.values(BloodGroup).includes(bloodGroup as BloodGroup)) {
        return NextResponse.json({ message: 'Invalid blood group provided.' }, { status: 400 });
    }

    // Prepare data for upsert
    const donorData: Omit<Prisma.DonorCreateInput, 'user'> = { // Omit 'user' as it's handled by connect
      name,
      bloodGroup: bloodGroup as BloodGroup,
      contactNumber,
      email: email || null, // Handle optional email
      district,
      city,
      isAvailable,
      campus: { connect: { id: campusId } }, // Connect to existing campus by ID
      group: { connect: { id: groupId } },   // Connect to existing group by ID
      // User will be connected in the upsert's create and update blocks
    };

    // Upsert the donor profile:
    // - If a donor profile with this userId exists, it updates it.
    // - If not, it creates a new one linked to this userId.
    const upsertedDonorProfile = await prisma.donor.upsert({
      where: {
        userId: session.user.id, // Unique identifier for the donor profile related to the user
      },
      update: {
        ...donorData, // Update with all new data
        // No need to specify user here as it's part of the 'where' for update
      },
      create: {
        ...donorData,
        user: { connect: { id: session.user.id } }, // Link to the logged-in user
      },
      include: {
        campus: true, // Return updated profile with relations
        group: true,
      }
    });

    // await prisma.$disconnect(); // Disconnect in finally block
    return NextResponse.json(upsertedDonorProfile, { status: 200 }); // 200 for update, 201 for create (upsert simplifies this)

  } catch (error: any) {
    console.error("Error creating/updating user's donor profile:", error);
    // await prisma.$disconnect(); // Disconnect in finally block

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed (e.g., foreign key constraint violation if campusId/groupId is invalid)
      if (error.code === 'P2025') { // Record to update not found (shouldn't happen with upsert create) or related record not found
        return NextResponse.json({ message: "Error with related data (e.g., Campus or Group ID not found)." }, { status: 400 });
      }
    }
    return NextResponse.json({ message: "Failed to save donor profile. Please try again." }, { status: 500 });
  } finally {
      await prisma.$disconnect(); // Ensure disconnect happens
  }
}