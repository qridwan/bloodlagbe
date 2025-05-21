// src/app/api/user/my-submissions/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const submissions = await prisma.userSubmittedList.findMany({
      where: {
        submittedByUserId: session.user.id,
      },
      orderBy: {
        submittedAt: 'desc', // Show most recent first
      },
      select: {
        // Select only necessary fields for the list view
        id: true,
        listName: true,
        submittedAt: true,
        status: true,
        adminNotes: true, // To show admin feedback for rejected items
        // donorDataJson: false, // No need to send full data for the list view
      },
    });

    return NextResponse.json(submissions, { status: 200 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json({ message: 'Failed to fetch your submissions.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
