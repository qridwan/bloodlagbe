/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, Prisma, BloodGroup } from '@prisma/client';
import Papa from 'papaparse';
import { convertKeysToCamel, convertToCamelCase } from '@/utils/convert';

const prisma = new PrismaClient();

// Define the expected CSV headers (adjust to your predefined format)
const EXPECTED_HEADERS = [
  'name',
  'bloodGroup',
  'contactNumber',
  'email', // Optional email specific to donor
  'district',
  'city',
  'campus', // Name of the campus
  'group', // Name of the social group
  'isAvailable', // Optional: 'TRUE'/'FALSE', 'YES'/'NO', '1'/'0'. Defaults to true if missing/invalid.
  'tagline',
];

// Helper function to normalize and validate blood group input
function parseBloodGroup(input: string | undefined | null): BloodGroup | null {
  if (!input) return null;
  const upperInput = input.trim().toUpperCase().replace('+', '_POSITIVE').replace('-', '_NEGATIVE');
  if (Object.values(BloodGroup).includes(upperInput as BloodGroup)) {
    return upperInput as BloodGroup;
  }
  console.warn(`Invalid blood group encountered: ${input}`);
  return null; // Return null for invalid blood groups
}

// Helper function to parse availability status
function parseAvailability(input: string | undefined | null): boolean {
  if (!input) return true; // Default to available if missing
  const lowerInput = input.trim().toLowerCase();
  if (['true', 'yes', '1'].includes(lowerInput)) {
    return true;
  }
  if (['false', 'no', '0'].includes(lowerInput)) {
    return false;
  }
  return true; // Default to available for unrecognized values
}

export async function POST(request: Request) {
  // 1. --- Authentication and Authorization ---
  const session = await getServerSession(authOptions);

  // Check if user is logged in and is an Admin
  // Note: Ensure your session callback in next-auth config adds the role to the session object
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.warn('Unauthorized upload attempt by:', session?.user?.email ?? 'Unauthenticated user');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 }); // Forbidden
  }
  // 2. --- File Handling & Parsing ---
  let fileContent: string;
  try {
    const formData = await request.formData();
    const file = formData.get('donorFile') as File | null; // 'donorFile' is the name attribute of your file input

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Basic check for CSV MIME type (can be improved)
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    fileContent = await file.text();
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ message: 'Error processing file upload' }, { status: 400 });
  }

  // 3. --- CSV Parsing ---
  let parseResult;
  try {
    parseResult = Papa.parse(fileContent, {
      header: true, // Use the first row as headers
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(), // Normalize headers
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV Parsing Errors:', parseResult.errors);
      // Provide more specific error if possible
      return NextResponse.json(
        { message: 'Error parsing CSV file.', errors: parseResult.errors },
        { status: 400 }
      );
    }

    // Validate headers (optional but recommended)
    parseResult.meta.fields = parseResult.meta.fields?.map((hd) => convertToCamelCase(hd));
    const headers = parseResult.meta.fields;
    console.log({ headers });
    if (!headers || !EXPECTED_HEADERS.every((h) => headers.includes(h))) {
      console.warn('CSV Headers mismatch. Expected:', EXPECTED_HEADERS, 'Got:', headers);
      return NextResponse.json(
        {
          message: `CSV headers do not match expected format. Expected headers: ${EXPECTED_HEADERS.join(
            ', '
          )}`,
        },
        { status: 400 }
      );
    }

    console.log(`Parsed ${parseResult.data.length} rows from CSV.`);
  } catch (error) {
    console.error('CSV Parsing Failed:', error);
    return NextResponse.json({ message: 'Failed to parse CSV data' }, { status: 500 });
  }

  // 4. --- Data Validation and Preparation ---
  const donorsToCreate: Prisma.DonorCreateManyInput[] = [];
  const errors: { row: number; message: string; data: any }[] = [];
  const campusCache: { [name: string]: string } = {}; // Cache for campus IDs
  const groupCache: { [name: string]: string } = {}; // Cache for group IDs

  for (const [index, row] of (parseResult.data as any[]).entries()) {
    const rowNumber = index + 2; // Account for header row and 0-based index
    const cRow = convertKeysToCamel(row);
    console.log(cRow);
    // Basic row validation
    if (
      !cRow.name ||
      !cRow.bloodGroup ||
      !cRow.contactNumber ||
      !cRow.district ||
      !cRow.city ||
      !cRow.campus ||
      !cRow.group
    ) {
      errors.push({
        row: rowNumber,
        message: 'Missing required fields in row.',
        data: cRow,
      });
      continue;
    }

    // Validate and normalize data
    const bloodGroup = parseBloodGroup(cRow.bloodGroup);
    if (!bloodGroup) {
      errors.push({
        row: rowNumber,
        message: `Invalid Blood Group: ${cRow.bloodGroup}`,
        data: cRow,
      });
      continue;
    }

    const isAvailable = parseAvailability(cRow.isAvailable);
    const campusName = cRow.campus.trim();
    const groupName = cRow.group.trim();

    try {
      // Find or Create Campus (using cache)
      let campusId = campusCache[campusName.toLowerCase()];
      if (!campusId) {
        const campus = await prisma.campus.upsert({
          where: { name: campusName },
          update: {}, // No update needed if found
          create: { name: campusName },
        });
        campusId = campus.id;
        campusCache[campusName.toLowerCase()] = campusId; // Add to cache
      }

      // Find or Create Group (using cache)
      let groupId = groupCache[groupName.toLowerCase()];
      if (!groupId) {
        const group = await prisma.group.upsert({
          where: { name: groupName },
          update: {},
          create: { name: groupName },
        });
        groupId = group.id;
        groupCache[groupName.toLowerCase()] = groupId;
      }

      // You might want to check if a donor with the same contactNumber or email exists first.
      donorsToCreate.push({
        name: cRow.name.trim(),
        bloodGroup: bloodGroup,
        contactNumber: cRow.contactNumber.trim(),
        email: cRow.email?.trim() ?? null,
        district: cRow.district.trim(),
        city: cRow.city.trim(),
        isAvailable: isAvailable,
        campusId: campusId,
        groupId: groupId,
        tagline: cRow.tagline?.trim() ?? null,
      });
    } catch (dbError: any) {
      errors.push({
        row: rowNumber,
        message: `Database error processing row: ${dbError.message}`,
        data: cRow,
      });
    }
  }

  // 5. --- Database Insertion ---
  let createdCount = 0;
  if (donorsToCreate.length > 0) {
    try {
      // Use createMany for better performance with bulk inserts
      const result = await prisma.donor.createMany({
        data: donorsToCreate,
        skipDuplicates: true, // **Important**: Decide if you want to skip duplicates based on unique constraints (if any defined). Currently, no unique constraints on donor fields other than userId. Consider adding one (e.g., on contactNumber).
      });
      createdCount = result.count;
      console.log(`Successfully created ${createdCount} donor records.`);
    } catch (error: any) {
      console.error('Error inserting donors:', error);
      // If createMany fails entirely (e.g., constraint violation without skipDuplicates)
      return NextResponse.json(
        { message: `Database error during bulk insert: ${error.message}` },
        { status: 500 }
      );
    }
  }

  // 6. --- Return Response ---
  const totalRows = (parseResult.data as any[]).length;
  console.log(
    `Upload complete. Processed: ${totalRows}, Created: ${createdCount}, Errors: ${errors.length}`
  );

  // Clear caches if needed (though they are request-scoped here)
  // delete campusCache; delete groupCache;

  await prisma.$disconnect();

  return NextResponse.json(
    {
      message: `Upload processed. ${createdCount} donors added. ${errors.length} rows had errors.`,
      successCount: createdCount,
      errorCount: errors.length,
      errors: errors, // Include detailed errors in the response
    },
    { status: 200 }
  ); // OK status, even if there were row errors
}
