// src/app/admin/submitted-lists/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  Clock10Icon,
  DownloadCloudIcon,
  EyeIcon,
  XCircleIcon,
} from 'lucide-react';

// Matches Prisma SubmissionStatus enum
type SubmissionStatus = 'PENDING_REVIEW' | 'APPROVED_IMPORTED' | 'REJECTED' | 'NEEDS_REVISION';

interface Submitter {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface SubmittedList {
  id: string;
  listName?: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  submittedByUser?: Submitter | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  donorDataJson?: any; // For count, not displaying full JSON here
  notes?: string | null;
}

export default function AdminSubmittedListsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [lists, setLists] = useState<SubmittedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus>('PENDING_REVIEW');

  // Authorization check
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin/submitted-lists');
    } else if (session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [session, sessionStatus, router]);

  const fetchSubmittedLists = useCallback(
    async (filter: SubmissionStatus) => {
      if (session?.user?.role !== 'ADMIN') return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/submitted-lists?status=${filter}`);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Failed to fetch submitted lists.' }));
          throw new Error(errorData.message);
        }
        const data: SubmittedList[] = await response.json();
        setLists(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || 'Could not load submitted lists.');
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSubmittedLists(statusFilter);
    }
  }, [sessionStatus, session, fetchSubmittedLists, statusFilter]);

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED_IMPORTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'NEEDS_REVISION':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock10Icon className="w-4 h-4 mr-1.5" />;
      case 'APPROVED_IMPORTED':
        return <CheckCircleIcon className="w-4 h-4 mr-1.5" />;
      case 'REJECTED':
        return <XCircleIcon className="w-4 h-4 mr-1.5" />;
      default:
        return null;
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <p className="text-lg animate-pulse text-sky-600">Loading Submitted Lists...</p>
      </div>
    );
  }
  // Fallback for auth, layout should ideally handle this redirect
  if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="text-center p-10">
        <p className="text-xl text-red-600">Access Denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="pb-4 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            User Submitted Donor Lists
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Review and manage donor lists uploaded by users.
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <label htmlFor="statusFilter" className="sr-only">
            Filter by status
          </label>
          <select
            id="statusFilter"
            name="statusFilter"
            className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus)}
          >
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED_IMPORTED">Approved & Imported</option>
            <option value="REJECTED">Rejected</option>
            <option value="NEEDS_REVISION">Needs Revision</option>
          </select>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
          <p className="font-semibold">Error:</p> <p>{error}</p>
          <button
            onClick={() => fetchSubmittedLists(statusFilter)}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && lists.length === 0 && (
        <div className="text-center py-10 bg-white p-6 rounded-lg shadow-md">
          <DownloadCloudIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-500">
            No submissions found for &quot;{statusFilter.replace('_', ' ').toLowerCase()}&quot;
            status.
          </p>
        </div>
      )}

      {!isLoading && !error && lists.length > 0 && (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    List Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Submitted By
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Record Count
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {lists.map((list) => (
                  <tr key={list.id} className="hover:bg-sky-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-slate-900"
                        title={list.listName || 'Untitled List'}
                      >
                        {list.listName || 'Untitled List'}
                      </div>
                      {list.notes && (
                        <div
                          className="text-xs text-slate-500 truncate max-w-xs"
                          title={list.notes}
                        >
                          {list.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {list.submittedByUser ? (
                        <>
                          <span className="font-medium text-slate-800">
                            {list.submittedByUser.name || 'User'}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {list.submittedByUser.email}
                          </span>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {new Date(list.submittedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 text-center">
                      {Array.isArray(list.donorDataJson) ? list.donorDataJson.length : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(list.status)}`}
                      >
                        {getStatusIcon(list.status)}
                        {list.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/submittedLists/${list.id}`} // Link to individual review page
                        className="text-sky-600 hover:text-sky-800 inline-flex items-center"
                        title="View & Review Submission"
                      >
                        <EyeIcon className="w-5 h-5 mr-1" /> Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
