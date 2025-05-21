// src/app/api/filters/options/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, BloodGroup } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }, // Only select necessary fields
    });

    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }, // Only select necessary fields
    });

    // Blood groups are from an enum, so we can define them directly
    // Or, if you prefer, you can derive them from Prisma.BloodGroup values
    const bloodGroups = Object.values(BloodGroup).map((bg) => ({
      id: bg,
      name: bg.replace('_POSITIVE', '+').replace('_NEGATIVE', '-'),
    }));

    await prisma.$disconnect();

    return NextResponse.json(
      {
        campuses,
        groups,
        bloodGroups,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching filter options:', error);
    await prisma.$disconnect();
    return NextResponse.json({ message: 'Error fetching filter options' }, { status: 500 });
  }
}
