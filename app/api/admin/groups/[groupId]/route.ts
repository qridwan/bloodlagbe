// src/app/api/admin/groups/[groupId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    groupId?: string;
  };
}

// --- PUT Handler: Update an existing Group ---
export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const groupId = params.groupId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!groupId) {
    return NextResponse.json({ message: 'Group ID is required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { message: 'New group name is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    const conflictingGroup = await prisma.group.findFirst({
      where: {
        name: {
          equals: trimmedName,
        },
        NOT: {
          id: groupId,
        },
      },
    });

    if (conflictingGroup) {
      return NextResponse.json(
        { message: `Another group with the name "${trimmedName}" already exists.` },
        { status: 409 }
      );
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { name: trimmedName },
    });

    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating group ID ${groupId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { message: `Group with ID ${groupId} not found.` },
          { status: 404 }
        );
      }
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: `A group with the name "${(await request.json()).name}" already exists.` },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ message: 'Failed to update group.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- DELETE Handler: Delete a Group ---
export async function DELETE(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const groupId = params.groupId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!groupId) {
    return NextResponse.json({ message: 'Group ID is required.' }, { status: 400 });
  }

  try {
    await prisma.group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ message: 'Group deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting group ID ${groupId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { message: `Group with ID ${groupId} not found.` },
          { status: 404 }
        );
      }
      if (
        error.code === 'P2003' ||
        (error.meta && (error.meta.cause as string)?.includes('foreign key constraint fails'))
      ) {
        return NextResponse.json(
          {
            message:
              'Cannot delete group: It is currently associated with existing donor records. Please reassign or remove those donors first.',
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ message: 'Failed to delete group.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
