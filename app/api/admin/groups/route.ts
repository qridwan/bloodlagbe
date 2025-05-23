// src/app/api/admin/groups/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

// --- GET Handler: List all Groups ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const groups = await prisma.group.findMany({
      orderBy: {
        name: 'asc', // Order alphabetically by name
      },
      include: {
        // Optionally include a count of donors for each group
        _count: {
          select: { donors: true },
        },
      },
    });

    return NextResponse.json(groups, { status: 200 });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ message: 'Failed to fetch groups' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- POST Handler: Create a new Group ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Group name is required and cannot be empty.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for existing group with the same name (case-insensitive)
    const existingGroup = await prisma.group.findFirst({
      where: {
        name: {
          equals: trimmedName
        },
      },
    });

    if (existingGroup) {
      return NextResponse.json({ message: `Group with name "${trimmedName}" already exists.` }, { status: 409 });
    }

    const newGroup = await prisma.group.create({
      data: {
        name: trimmedName,
      },
    });

    return NextResponse.json(newGroup, { status: 201 });

  } catch (error: any) {
    console.error('Error creating group:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'A group with this name already exists (database constraint).' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create group. Please try again.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}