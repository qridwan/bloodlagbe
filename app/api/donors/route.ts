// src/app/api/donors/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma, BloodGroup } from "@prisma/client";

const prisma = new PrismaClient();
const ITEMS_PER_PAGE = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // --- Filtering Parameters ---
  const bloodGroup = searchParams.get("bloodGroup") as BloodGroup | null;
  const campusId = searchParams.get("campusId");
  const groupId = searchParams.get("groupId");
  const city = searchParams.get("city");
  const district = searchParams.get("district");
  const availability = searchParams.get("availability"); // 'true' or 'false'

  // --- Pagination Parameters ---
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(
    searchParams.get("limit") || ITEMS_PER_PAGE.toString(),
    10
  );
  const skip = (page - 1) * limit;

  // --- Build Prisma Where Clause for Filtering ---
  const where: Prisma.DonorWhereInput = {};

  if (bloodGroup && Object.values(BloodGroup).includes(bloodGroup)) {
    where.bloodGroup = bloodGroup;
  }
  if (campusId) {
    where.campusId = campusId;
  }
  if (groupId) {
    where.groupId = groupId;
  }
  if (city) {
    where.city = { contains: city }; // Case-insensitive search for city
  }
  if (district) {
    where.district = { contains: district }; // Case-insensitive search for district
  }
  if (availability === "true") {
    where.isAvailable = true;
  } else if (availability === "false") {
    where.isAvailable = false;
  }

  try {
    // --- Fetch Donors with Filters and Pagination ---
    console.log("fetching donors data---where: ", where);
    const donors = await prisma.donor.findMany({
      where,
      include: {
        campus: true, // Include related campus details
        group: true, // Include related group details
      },
      // orderBy: {
      //   // You can add default sorting, e.g., by availability then by name
      //   isAvailable: 'desc',
      //   updatedAt: 'desc', // Or createdAt, or name
      // },
      skip: skip,
      take: limit,
    });

    // --- Get Total Count for Pagination ---
    const totalDonors = await prisma.donor.count({
      where,
    });

    await prisma.$disconnect();

    return NextResponse.json(
      {
        donors,
        pagination: {
          totalItems: totalDonors,
          currentPage: page,
          itemsPerPage: limit,
          totalPages: Math.ceil(totalDonors / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching donors:", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { message: "Error fetching donor data" },
      { status: 500 }
    );
  }
}
