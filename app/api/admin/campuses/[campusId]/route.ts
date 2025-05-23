// src/app/api/admin/campuses/[campusId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    campusId?: string;
  };
}

// --- PUT Handler: Update an existing Campus ---
export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const campusId = params.campusId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!campusId) {
    return NextResponse.json({ message: 'Campus ID is required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { message: 'New campus name is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if another campus (excluding the current one) already has this name (case-insensitive)
    const conflictingCampus = await prisma.campus.findFirst({
      where: {
        name: {
          equals: trimmedName,
        },
        NOT: {
          id: campusId, // Exclude the current campus being edited
        },
      },
    });

    if (conflictingCampus) {
      return NextResponse.json(
        { message: `Another campus with the name "${trimmedName}" already exists.` },
        { status: 409 }
      ); // Conflict
    }

    const updatedCampus = await prisma.campus.update({
      where: { id: campusId },
      data: { name: trimmedName },
    });

    return NextResponse.json(updatedCampus, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating campus ID ${campusId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record to update not found
        return NextResponse.json(
          { message: `Campus with ID ${campusId} not found.` },
          { status: 404 }
        );
      }
      if (error.code === 'P2002') {
        // Unique constraint failed (should be caught by the check above, but as a fallback)
        return NextResponse.json(
          {
            message: `A campus with the name "${(await request.json()).name}" already exists (database constraint).`,
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ message: 'Failed to update campus.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- DELETE Handler: Delete a Campus ---
export async function DELETE(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const campusId = params.campusId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!campusId) {
    return NextResponse.json({ message: 'Campus ID is required.' }, { status: 400 });
  }

  try {
    // Attempt to delete the campus
    // Prisma will prevent deletion if there are related Donor records due to `onDelete: Restrict`
    await prisma.campus.delete({
      where: { id: campusId },
    });

    return NextResponse.json({ message: 'Campus deleted successfully.' }, { status: 200 }); // Or 204 No Content
  } catch (error: any) {
    console.error(`Error deleting campus ID ${campusId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record to delete not found
        return NextResponse.json(
          { message: `Campus with ID ${campusId} not found.` },
          { status: 404 }
        );
      }
      if (
        error.code === 'P2003' ||
        (error.meta && (error.meta.cause as string)?.includes('foreign key constraint fails'))
      ) {
        // P2003: Foreign key constraint failed on the field
        // This means donors are still linked to this campus
        return NextResponse.json(
          {
            message:
              'Cannot delete campus: It is currently associated with existing donor records. Please reassign or remove those donors first.',
          },
          { status: 409 }
        ); // Conflict
      }
    }
    return NextResponse.json({ message: 'Failed to delete campus.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
