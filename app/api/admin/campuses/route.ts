// src/app/api/admin/campuses/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

// --- GET Handler: List all Campuses ---
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const campuses = await prisma.campus.findMany({
      orderBy: {
        name: 'asc', // Order alphabetically by name
      },
      include: {
        // Optionally include a count of donors for each campus
        _count: {
          select: { donors: true },
        },
      },
    });

    return NextResponse.json(campuses, { status: 200 });

  } catch (error) {
    console.error('Error fetching campuses:', error);
    return NextResponse.json({ message: 'Failed to fetch campuses' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- POST Handler: Create a new Campus ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Campus name is required and cannot be empty.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for existing campus with the same name (case-insensitive for better UX, though DB is case-sensitive for unique constraint)
    // The unique constraint in Prisma schema for `name` is typically case-sensitive by default in PostgreSQL.
    // To enforce case-insensitivity at DB level, you'd need a specific index or use a citext type.
    // For now, we check here before attempting to create.
    const existingCampus = await prisma.campus.findFirst({
      where: {
        name: {
          equals: trimmedName
        },
      },
    });

    if (existingCampus) {
      return NextResponse.json({ message: `Campus with name "${trimmedName}" already exists.` }, { status: 409 }); // 409 Conflict
    }

    // Create new campus
    const newCampus = await prisma.campus.create({
      data: {
        name: trimmedName,
      },
    });

    return NextResponse.json(newCampus, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('Error creating campus:', error);
    // Handle Prisma's unique constraint violation error specifically if the above check fails for some reason (e.g. race condition or case sensitivity differences)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // P2002 is the unique constraint violation code
      return NextResponse.json({ message: 'A campus with this name already exists (database constraint).' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create campus. Please try again.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}