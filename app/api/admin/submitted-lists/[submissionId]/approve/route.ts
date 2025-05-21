import { NextResponse } from 'next/server';
import { PrismaClient, SubmissionStatus, BloodGroup } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

interface RouteContext {
  params: {
    submissionId?: string;
  };
}

// Helper function to parse and validate blood group (similar to admin CSV upload)
function parseBloodGroup(input: string | undefined | null): BloodGroup | null {
  if (!input) return null;
  const upperInput = String(input)
    .trim()
    .toUpperCase()
    .replace('+', '_POSITIVE')
    .replace('-', '_NEGATIVE');
  if (Object.values(BloodGroup).includes(upperInput as BloodGroup)) {
    return upperInput as BloodGroup;
  }
  console.warn(`Invalid blood group encountered during submission import: ${input}`);
  return null;
}

// Helper function to parse availability status (similar to admin CSV upload)
function parseAvailability(input: string | boolean | undefined | null): boolean {
  if (typeof input === 'boolean') return input;
  if (!input) return true; // Default to available if missing or empty string
  const lowerInput = String(input).trim().toLowerCase();
  if (['true', 'yes', '1'].includes(lowerInput)) return true;
  if (['false', 'no', '0'].includes(lowerInput)) return false;
  return true; // Default to available for unrecognized string values
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { params } = context;
  const submissionId = params.submissionId;

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  if (!submissionId) {
    return NextResponse.json({ message: 'Submission ID is required.' }, { status: 400 });
  }

  let recordsProcessed = 0;
  let recordsImported = 0;
  let recordsSkippedOrFailed = 0;
  const errors: string[] = [];
  const campusCache: { [name: string]: string } = {};
  const groupCache: { [name: string]: string } = {};

  try {
    const body = await request.json();
    const { adminNotes } = body; // Optional admin notes for the approval

    // Transaction to ensure atomicity of submission status update and donor imports
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.userSubmittedList.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error('SUBMISSION_NOT_FOUND');
      }

      if (submission.status !== SubmissionStatus.PENDING_REVIEW) {
        throw new Error('SUBMISSION_NOT_PENDING');
      }

      if (!submission.donorDataJson || !Array.isArray(submission.donorDataJson)) {
        throw new Error('INVALID_DONOR_DATA');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const donorList = submission.donorDataJson as Array<Record<string, any>>;
      recordsProcessed = donorList.length;

      for (const [index, donorData] of donorList.entries()) {
        const currentRecordNumber = index + 1;

        // --- Validate submitted donor data ---
        const {
          name,
          blood_group,
          contact_number,
          email,
          district,
          city,
          campus: campusNameInput,
          group: groupNameInput,
          is_available,
          tagline,
        } = donorData;

        if (
          !name ||
          !blood_group ||
          !contact_number ||
          !district ||
          !city ||
          !campusNameInput ||
          !groupNameInput
        ) {
          errors.push(
            `Record ${currentRecordNumber}: Missing required fields (name, blood_group, contact_number, district, city, campus, group).`
          );
          recordsSkippedOrFailed++;
          continue;
        }

        const parsedBloodGroup = parseBloodGroup(blood_group);
        if (!parsedBloodGroup) {
          errors.push(
            `Record ${currentRecordNumber} ('${name}'): Invalid blood group '${blood_group}'.`
          );
          recordsSkippedOrFailed++;
          continue;
        }
        const parsedIsAvailable = parseAvailability(is_available);
        const campusName = String(campusNameInput).trim();
        const groupName = String(groupNameInput).trim();

        // --- Find or Create Campus (cached) ---
        let campusId = campusCache[campusName.toLowerCase()];
        if (!campusId) {
          const campus = await tx.campus.upsert({
            where: { name: campusName },
            update: {},
            create: { name: campusName },
          });
          campusId = campus.id;
          campusCache[campusName.toLowerCase()] = campusId;
        }

        // --- Find or Create Group (cached) ---
        let groupId = groupCache[groupName.toLowerCase()];
        if (!groupId) {
          const group = await tx.group.upsert({
            where: { name: groupName },
            update: {},
            create: { name: groupName },
          });
          groupId = group.id;
          groupCache[groupName.toLowerCase()] = groupId;
        }

        // --- Check for existing donor (by contactNumber for example) ---
        // More sophisticated duplicate checking might be needed based on requirements
        const existingDonor = await tx.donor.findFirst({
          where: { contactNumber: String(contact_number).trim() },
        });

        if (existingDonor) {
          // Option: Update existing donor, or skip. For now, we skip.
          errors.push(
            `Record ${currentRecordNumber} ('${name}'): Skipped. Donor with contact number ${contact_number} already exists (ID: ${existingDonor.id}).`
          );
          recordsSkippedOrFailed++;
          continue;
        }

        // --- Create new Donor record ---
        try {
          await tx.donor.create({
            data: {
              name: String(name).trim(),
              bloodGroup: parsedBloodGroup,
              contactNumber: String(contact_number).trim(),
              email: email ? String(email).trim() : null,
              district: String(district).trim(),
              city: String(city).trim(),
              campusId: campusId,
              groupId: groupId,
              isAvailable: parsedIsAvailable,
              tagline: tagline ? String(tagline).trim() : null,
              // This donor is not directly linked to a User account via userId here,
              // as these are from a submitted list. A user might later claim this profile if their contact matches.
            },
          });
          recordsImported++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (donorCreateError: any) {
          errors.push(
            `Record ${currentRecordNumber} ('${name}'): Error during import - ${donorCreateError.message}.`
          );
          recordsSkippedOrFailed++;
        }
      } // End of loop

      // --- Update the submission status ---
      const finalUpdatedSubmission = await tx.userSubmittedList.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.APPROVED_IMPORTED,
          adminNotes: adminNotes || submission.adminNotes, // Keep old notes if new ones are not provided
          reviewedAt: new Date(),
          reviewedByAdminId: session.user.id,
        },
        include: {
          reviewedByAdmin: { select: { name: true, email: true } },
          submittedByUser: { select: { name: true, email: true } },
        },
      });
      return finalUpdatedSubmission;
    }); // End of transaction

    return NextResponse.json(
      {
        message: `Import process completed. Processed: ${recordsProcessed}, Imported: ${recordsImported}, Skipped/Failed: ${recordsSkippedOrFailed}.`,
        submission: result,
        importErrors: errors,
      },
      { status: 200 }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`Error approving submission ID ${submissionId}:`, error);
    let statusCode = 500;
    let message = 'Failed to approve and import submission.';
    if (error.message === 'SUBMISSION_NOT_FOUND') {
      statusCode = 404;
      message = `Submission with ID ${submissionId} not found.`;
    } else if (error.message === 'SUBMISSION_NOT_PENDING') {
      statusCode = 409;
      message = 'Submission is not pending review.';
    } else if (error.message === 'INVALID_DONOR_DATA') {
      statusCode = 400;
      message = 'Submitted donor data is invalid or missing.';
    }
    // Handle Prisma transaction errors if specific codes are known
    return NextResponse.json({ message, details: error.message, errors }, { status: statusCode });
  } finally {
    await prisma.$disconnect();
  }
}
