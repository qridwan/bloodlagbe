// src/app/admin/submitted-lists/[submissionId]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  InfoIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  XCircleIcon,
} from 'lucide-react';

// Assuming SubmissionStatus and Submitter types are defined or can be imported
type SubmissionStatus = 'PENDING_REVIEW' | 'APPROVED_IMPORTED' | 'REJECTED' | 'NEEDS_REVISION';
interface Submitter {
  id: string;
  name?: string | null;
  email?: string | null;
}
// Structure of an individual donor record within donorDataJson
// (matching what user submits, e.g., snake_case headers)
interface SubmittedDonorRecord {
  id?: string | number; // Crucial for editable table keys
  name?: string;
  blood_group?: string;
  contact_number?: string;
  email?: string;
  district?: string;
  city?: string;
  campus?: string;
  group?: string;
  is_available?: string | boolean;
  tagline?: string;
  [key: string]: any;
}

interface SubmissionDetails {
  id: string;
  listName?: string | null;
  notes?: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  donorDataJson: SubmittedDonorRecord[]; // Parsed JSON
  submittedByUserId: string;
  submittedByUser?: Submitter | null;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  reviewedByAdmin?: Submitter | null;
  adminNotes?: string | null;
}

const createNewAdminDonorRow = (): SubmittedDonorRecord => ({
  id: `admin_new_${Date.now()}_${Math.random()}`,
  name: '',
  blood_group: '',
  contact_number: '',
  email: '',
  district: '',
  city: '',
  campus: '',
  group: '',
  is_available: 'true',
  tagline: '',
});

export default function ReviewSubmissionPage() {
  const { data: session, status: sessionStatus } = useSession(); // Ensure session is correctly destructured
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for editable donor data
  const [editableDonorData, setEditableDonorData] = useState<SubmittedDonorRecord[]>([]);
  const [donorTableHeaders, setDonorTableHeaders] = useState<string[]>([]);

  // State for inline editing
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(
    null
  );
  const [editValue, setEditValue] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false); // For both approve/reject actions
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null); // For success messages
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]); // To store errors from import process

  const initialDataLoaded = useRef(false);
  const ADMIN_DRAFT_STORAGE_KEY = `bloodLagbeAdminReviewDraft_${submissionId}`;

  // --- SESSION STORAGE & DATA FETCHING ---
  useEffect(() => {
    // Load from sessionStorage on initial mount after session check and if submissionId is present
    if (sessionStatus === 'authenticated' && submissionId && !initialDataLoaded.current) {
      const savedDraftString = sessionStorage.getItem(ADMIN_DRAFT_STORAGE_KEY);
      if (savedDraftString) {
        try {
          const draft = JSON.parse(savedDraftString);
          setEditableDonorData(draft.editableDonorData || []);
          setAdminReviewNotes(draft.adminReviewNotes || '');
          if (draft.editableDonorData && draft.editableDonorData.length > 0) {
            setDonorTableHeaders(
              Object.keys(draft.editableDonorData[0])
                .filter((k) => k !== 'id')
                .map((h) => h.replace(/_/g, ' '))
            );
          }
          console.log(`Loaded admin draft for submission ${submissionId} from session storage.`);
        } catch (e) {
          console.error('Failed to parse admin draft from session storage:', e);
          sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY);
        }
      }
    }
  }, [sessionStatus, submissionId, ADMIN_DRAFT_STORAGE_KEY]);
  // Authorization check
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/admin/submitted-lists/${submissionId}`);
    } else if (session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [session, sessionStatus, router, submissionId]);

  const fetchSubmissionDetails = useCallback(async () => {
    if (!submissionId || session?.user?.role !== 'ADMIN') return;
    setIsLoading(true);
    setError(null);
    setActionError(null);
    setActionSuccessMessage(null);
    setImportErrors([]);
    try {
      const response = await fetch(`/api/admin/submitted-lists/${submissionId}`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Failed to fetch submission (ID: ${submissionId}).` }));
        throw new Error(errorData.message);
      }
      const data: SubmissionDetails = await response.json();
      let donorJsonData = data.donorDataJson;

      if (typeof donorJsonData === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        try {
          data.donorDataJson = JSON.parse(donorJsonData);
        } catch (e) {
          data.donorDataJson = [];
        }
      }
      if (!Array.isArray(data.donorDataJson)) data.donorDataJson = [];
      setSubmission(data);
      setAdminReviewNotes(data.adminNotes || '');
      const sessionDraftString = sessionStorage.getItem(ADMIN_DRAFT_STORAGE_KEY);
      if (sessionDraftString) {
        const draft = JSON.parse(sessionDraftString);
        // If a draft exists, assume it's the admin's current work-in-progress
        setEditableDonorData(
          draft.editableDonorData.map((item: SubmittedDonorRecord, index: number) => ({
            id: item.id || `draft_${index}_${Date.now()}`,
            ...item,
          }))
        );
        setAdminReviewNotes(draft.adminReviewNotes); // Session storage notes might be more current
        if (draft.editableDonorData && draft.editableDonorData.length > 0) {
          setDonorTableHeaders(
            Object.keys(draft.editableDonorData[0])
              .filter((k) => k !== 'id')
              .map((h) => h.replace(/_/g, ' '))
          );
        } else if (donorJsonData.length > 0) {
          setDonorTableHeaders(
            Object.keys(donorJsonData[0])
              .filter((k) => k !== 'id')
              .map((h) => h.replace(/_/g, ' '))
          );
        }
      } else {
        // No draft, use data from API
        setEditableDonorData(
          donorJsonData.map((item, index) => ({
            id: item.id || `api_${index}_${Date.now()}`,
            ...item,
          }))
        );
        if (donorJsonData.length > 0) {
          setDonorTableHeaders(
            Object.keys(donorJsonData[0])
              .filter((k) => k !== 'id')
              .map((h) => h.replace(/_/g, ' '))
          );
        }
      }
      initialDataLoaded.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Could not load submission details.');
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, session]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN' && submissionId) {
      fetchSubmissionDetails();
    }
  }, [sessionStatus, session, submissionId, fetchSubmissionDetails]);
  // Save to sessionStorage whenever editableDonorData or adminReviewNotes change
  useEffect(() => {
    if (
      sessionStatus === 'authenticated' &&
      submissionId &&
      initialDataLoaded.current &&
      !isLoading
    ) {
      const draft = {
        editableDonorData,
        adminReviewNotes,
        timestamp: Date.now(),
      };
      if (editableDonorData.length > 0 || adminReviewNotes.trim() !== '') {
        sessionStorage.setItem(ADMIN_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        // console.log(`Saved admin draft for submission ${submissionId} to session storage.`);
      } else {
        sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY); // Clear if nothing to save
      }
    }
  }, [
    editableDonorData,
    adminReviewNotes,
    submissionId,
    sessionStatus,
    isLoading,
    ADMIN_DRAFT_STORAGE_KEY,
  ]);
  // --- EDITABLE TABLE HANDLERS ---
  const handleEditCell = (rowIndex: number, columnKey: string) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(String(editableDonorData[rowIndex][columnKey] ?? ''));
  };
  const handleEditInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditValue(event.target.value);
  };
  const handleSaveCell = (rowIndex: number, columnKey: string) => {
    if (editingCell && editingCell.rowIndex === rowIndex && editingCell.columnKey === columnKey) {
      const updatedData = [...editableDonorData];
      updatedData[rowIndex] = { ...updatedData[rowIndex], [columnKey]: editValue };
      setEditableDonorData(updatedData);
      setEditingCell(null);
    }
  };
  const handleCellBlur = (rowIndex: number, columnKey: string) => {
    if (editingCell && editingCell.rowIndex === rowIndex && editingCell.columnKey === columnKey) {
      handleSaveCell(rowIndex, columnKey);
    }
  };
  const handleCellKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    columnKey: string
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveCell(rowIndex, columnKey);
    } else if (event.key === 'Escape') {
      setEditingCell(null);
    }
  };
  const handleDeleteRow = (rowIndexToDelete: number) => {
    if (window.confirm('Are you sure? This will remove the row from this review session.')) {
      setEditableDonorData((prevData) => prevData.filter((_, index) => index !== rowIndexToDelete));
    }
  };
  const handleAddRow = () => {
    setEditableDonorData((prevData) => [...prevData, createNewAdminDonorRow()]);
    if (editableDonorData.length === 0 && donorTableHeaders.length === 0) {
      setDonorTableHeaders(
        Object.keys(createNewAdminDonorRow())
          .filter((k) => k !== 'id')
          .map((h) => h.replace(/_/g, ' '))
      );
    }
  };
  // --- END EDITABLE TABLE HANDLERS ---
  // --- MODIFIED: Approve Action to send editableDonorData ---
  const handleApprove = async () => {
    if (!submission) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccessMessage(null);
    setImportErrors([]);
    try {
      const response = await fetch(`/api/admin/submitted-lists/${submission.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminNotes: adminReviewNotes,
          // Send the potentially edited donor data
          donorDataJson: editableDonorData.map(({ id, ...rest }) => rest), // Remove client-side 'id' before sending
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve and import submission.');
      }
      setActionSuccessMessage(
        result.message || 'Submission approved and import process initiated!'
      );
      if (result.importErrors && result.importErrors.length > 0) {
        setImportErrors(result.importErrors);
      }
      if (result.submission) {
        /* ... update local submission state ... */
      }
      sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY); // Clear draft on success
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccessMessage(null);
    setImportErrors([]);
    try {
      const response = await fetch(`/api/admin/submitted-lists/${submission.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: adminReviewNotes }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reject submission.');
      }
      setActionSuccessMessage(result.message || 'Submission rejected successfully.');
      if (result.submission) {
        let donorData = result.submission.donorDataJson;
        if (typeof donorData === 'string') {
          try {
            donorData = JSON.parse(donorData);
          } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            donorData = [];
          }
        }
        setSubmission({ ...result.submission, donorDataJson: donorData });
        setAdminReviewNotes(result.submission.adminNotes || '');
      }
      sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY); // Clear draft on success

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || sessionStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <p className="text-lg animate-pulse text-sky-600">Loading Submission Details...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Submission</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <Link
          href="/admin/submitted-lists"
          className="text-sky-600 hover:text-sky-800 inline-flex items-center"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Submissions List
        </Link>
      </div>
    );
  }
  if (!submission) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-xl text-gray-500">Submission not found or you do not have access.</p>
        <Link
          href="/admin/submitted-lists"
          className="text-sky-600 hover:text-sky-800 inline-flex items-center mt-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Submissions List
        </Link>
      </div>
    );
  }

  // Determine headers for the donor data table dynamically from the first record,
  // or use a predefined list if structure is guaranteed.
  const donorTableHeader =
    submission.donorDataJson.length > 0
      ? Object.keys(submission.donorDataJson[0]).map((header) => header.replace(/_/g, ' ')) // Make snake_case readable
      : [];

  return (
    <div className="space-y-8 container">
      <header className="pb-4 mb-2">
        <Link
          href="/admin/submittedLists"
          className="text-sm text-sky-600 hover:text-sky-800 inline-flex items-center mb-3"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to All Submissions
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Review Submitted Donor List
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          Details for submission ID:{' '}
          <span className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded">
            {submission.id}
          </span>
        </p>
      </header>
      {/* Action Messages */}
      {actionError && (
        <div className="my-4 p-4 rounded-md text-sm bg-red-100 text-red-800 border border-red-200 shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Action Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{actionError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {actionSuccessMessage && (
        <div className="my-4 p-4 rounded-md text-sm bg-green-100 text-green-700 border border-green-200 shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{actionSuccessMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {importErrors.length > 0 && (
        <div className="my-4 p-4 rounded-md text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <InfoIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Import Process Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {importErrors.map((errMsg, idx) => (
                    <li key={idx}>{errMsg}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Submission Meta Information */}
      <section className="p-6 bg-white rounded-lg shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500">List Name / Source</h3>
          <p className="mt-1 text-lg text-slate-900">{submission.listName || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">Submitted By</h3>
          <div className="mt-1 text-lg text-slate-900 flex items-center">
            <UserCircleIcon className="w-5 h-5 mr-2 text-slate-400" />
            {submission.submittedByUser
              ? `${submission.submittedByUser.name} (${submission.submittedByUser.email})`
              : 'Unknown User'}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">Submitted At</h3>
          <div className="mt-1 text-lg text-slate-900 flex items-center">
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-slate-400" />
            {new Date(submission.submittedAt).toLocaleString()}
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <h3 className="text-sm font-medium text-slate-500">User Notes</h3>
          <p className="mt-1 text-base text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
            {submission.notes || 'No notes provided.'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">Status</h3>
          <p
            className={`mt-1 font-semibold px-2 py-1 inline-block rounded-full text-xs
                ${
                  submission.status === 'PENDING_REVIEW'
                    ? 'bg-yellow-100 text-yellow-800'
                    : submission.status === 'APPROVED_IMPORTED'
                      ? 'bg-green-100 text-green-800'
                      : submission.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
          >
            {submission.status.replace('_', ' ')}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">Total Records</h3>
          <div className="mt-1 text-lg text-slate-900 flex items-center">
            <ClipboardCheckIcon className="w-5 h-5 mr-2 text-slate-400" />
            {submission.donorDataJson.length}
          </div>
        </div>
      </section>

      <section className="p-6 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-700">Submitted Donor Data (Editable)</h2>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={isProcessing}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" /> Add Row
          </button>
        </div>

        {editableDonorData.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-md max-h-[70vh]">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  {donorTableHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2.5 text-left font-semibold text-slate-600 capitalize"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {editableDonorData.map((donor, rowIndex) => (
                  <tr key={donor.id || `row-${rowIndex}`} className="hover:bg-slate-50">
                    {donorTableHeaders.map((headerKeyOriginal) => {
                      const headerKey = headerKeyOriginal.replace(/\s+/g, '_'); // Convert display header back to snake_case key
                      return (
                        <td
                          key={`${headerKey}-${rowIndex}`}
                          className="px-1 py-0.5 whitespace-nowrap group relative"
                        >
                          {editingCell?.rowIndex === rowIndex &&
                          editingCell?.columnKey === headerKey ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={handleEditInputChange}
                              onBlur={() => handleCellBlur(rowIndex, headerKey)}
                              onKeyDown={(e) => handleCellKeyDown(e, rowIndex, headerKey)}
                              autoFocus
                              className="w-full p-1 border border-indigo-500 rounded-sm text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            <div
                              onClick={() => handleEditCell(rowIndex, headerKey)}
                              className="p-1 min-h-[28px] cursor-pointer hover:bg-indigo-50 rounded-sm w-full block"
                            >
                              {String(donor[headerKey] ?? '')}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-300"
                        title="Delete row"
                        disabled={isProcessing}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No donor records loaded for editing.</p>
        )}
      </section>

      {/* Only show actions if status is PENDING_REVIEW */}
      {submission.status === 'PENDING_REVIEW' ? (
        <section className="p-6 bg-white rounded-lg shadow-xl mt-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Admin Actions</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="adminReviewNotes"
                className="block text-sm font-medium text-slate-700"
              >
                Review Notes (Optional - saved on Approve/Reject)
              </label>
              <textarea
                id="adminReviewNotes"
                rows={3}
                className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50"
                placeholder="Add notes for rejection or internal reference for approval..."
                value={adminReviewNotes}
                onChange={(e) => setAdminReviewNotes(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApprove} // Now calls the implemented function
                disabled={isProcessing}
                className="flex-1 px-6 py-2.5 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-wait"
              >
                {isProcessing ? 'Processing...' : 'Approve & Import List'}
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 px-6 py-2.5 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-wait"
              >
                {isProcessing ? 'Processing...' : 'Reject List'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="p-6 bg-white rounded-lg shadow-xl mt-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Submission Processed</h2>
          <p className="text-slate-600">
            This submission has already been processed. Status:
            <span
              className={`ml-2 font-semibold px-2 py-0.5 rounded-full text-xs
                    ${
                      submission.status === 'APPROVED_IMPORTED'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
            >
              {submission.status.replace('_', ' ')}
            </span>
          </p>
          {submission.adminNotes && (
            <div className="mt-3">
              <p className="text-sm font-medium text-slate-500">Admin Notes:</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                {submission.adminNotes}
              </p>
            </div>
          )}
          {submission.reviewedAt && submission.reviewedByAdmin && (
            <p className="text-xs text-slate-500 mt-2">
              Reviewed by {submission.reviewedByAdmin.name || submission.reviewedByAdmin.email} on{' '}
              {new Date(submission.reviewedAt).toLocaleString()}.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
