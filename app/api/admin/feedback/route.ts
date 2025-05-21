// src/app/api/admin/feedback/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const feedbacks = await prisma.platformFeedback.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        submittedByUser: {
          // Include user details if submitted by logged-in user
          select: { name: true, email: true },
        },
      },
    });
    return NextResponse.json(feedbacks, { status: 200 });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json({ message: 'Failed to fetch feedbacks' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
