// src/app/admin/feedback/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle, EllipsisIcon, EyeClosedIcon, EyeIcon } from 'lucide-react';
import Link from 'next/link';

// Assuming FeedbackType is available or defined
type FeedbackType = 'SUGGESTION' | 'BUG_REPORT' | 'COMPLIMENT' | 'GENERAL_INQUIRY';

interface SubmittedByUser {
  name?: string | null;
  email?: string | null;
}

interface FeedbackItem {
  id: string;
  feedbackType: FeedbackType;
  message: string;
  rating?: number | null;
  submittedAt: string;
  isReadByAdmin: boolean;
  adminNotes?: string | null;
  submittedByUserId?: string | null;
  submittedByUser?: SubmittedByUser | null;
  guestEmail?: string | null;
  guestName?: string | null;
  // Add any other fields you might need from your Prisma model
}

export default function AdminFeedbackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // For errors during actions
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null); // To show loading on specific row/button

  // Authorization check - Layout also does this, but defense in depth is fine.
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin/feedback');
    } else if (session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [session, sessionStatus, router]);

  const fetchFeedback = useCallback(async () => {
    if (session?.user?.role !== 'ADMIN') return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/feedback');
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch feedback data.' }));
        throw new Error(errorData.message);
      }
      const data: FeedbackItem[] = await response.json();
      setFeedbackItems(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Could not load feedback.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchFeedback();
    }
  }, [sessionStatus, session, fetchFeedback]);

  // --- MODIFIED: Function to handle marking feedback as read/unread ---
  const handleToggleReadStatus = async (feedbackId: string, currentIsReadStatus: boolean) => {
    const newStatus = !currentIsReadStatus;
    setUpdatingFeedbackId(feedbackId); // Indicate which item is being updated
    setActionError(null); // Clear previous action errors

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isReadByAdmin: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to update status.' }));
        throw new Error(errorData.message);
      }

      // Update UI: either re-fetch all or update the specific item locally
      setFeedbackItems((prevItems) =>
        prevItems.map((item) =>
          item.id === feedbackId ? { ...item, isReadByAdmin: newStatus } : item
        )
      );
      // Or: await fetchFeedback(); // Simpler but full re-fetch

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(`Error updating status for feedback ${feedbackId}:`, err);
      setActionError(
        `Failed to update status for item ${feedbackId.substring(0, 8)}...: ${err.message}`
      );
      // Optionally revert optimistic update here if you didn't re-fetch:
      // setFeedbackItems(prevItems =>
      //   prevItems.map(item =>
      //     item.id === feedbackId ? { ...item, isReadByAdmin: currentIsReadStatus } : item
      //   )
      // );
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        {' '}
        {/* Adjusted height */}
        <p className="text-lg animate-pulse text-sky-600">Loading Feedback Submissions...</p>
      </div>
    );
  }

  if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      /* Fallback, layout should handle redirect */
      <div className="text-center p-10">
        <p className="text-xl text-red-600">Access Denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {' '}
      {/* Main content wrapper for this page */}
      <header className="pb-4 mb-2">
        {' '}
        {/* Removed border-b to use card's shadow for separation */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Platform Feedback</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Review and manage user and guest feedback submissions.
        </p>
      </header>
      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
          <p className="font-semibold">Error:</p> <p>{error}</p>
          <button
            onClick={fetchFeedback}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
      {actionError /* For errors during toggle status action */ && (
        <div className="p-3 my-2 rounded-md text-sm bg-red-100 text-red-700 shadow">
          <p className="font-semibold">Update Error:</p> <p>{actionError}</p>
        </div>
      )}
      {!isLoading && !error && feedbackItems.length === 0 && (
        <div className="text-center py-10 bg-white p-6 rounded-lg shadow-md">
          <EllipsisIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-500">No feedback submissions yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            When users submit feedback, it will appear here.
          </p>
        </div>
      )}
      {!isLoading && !error && feedbackItems.length > 0 && (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
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
                    From
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Message
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Rating
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
                {feedbackItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`${item.isReadByAdmin ? 'bg-slate-50/70' : 'hover:bg-sky-50/50'}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {new Date(item.submittedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="block text-xs text-slate-500">
                        {new Date(item.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {item.submittedByUser ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {item.submittedByUser.name || 'User'}
                          </span>
                          <span
                            className="text-xs text-slate-500 truncate"
                            title={item.submittedByUser.email || ''}
                          >
                            {item.submittedByUser.email}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {item.guestName || 'Guest'}
                          </span>
                          <span
                            className="text-xs text-slate-500 truncate"
                            title={item.guestEmail || ''}
                          >
                            {item.guestEmail || '(No email)'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              item.feedbackType === 'BUG_REPORT'
                                ? 'bg-red-100 text-red-800'
                                : item.feedbackType === 'SUGGESTION'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.feedbackType === 'COMPLIMENT'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                      >
                        {item.feedbackType.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-slate-700 max-w-xs hover:overflow-visible hover:whitespace-normal truncate"
                      title={item.message}
                    >
                      {item.message}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 text-center">
                      {item.rating ? `${item.rating} ★` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {item.isReadByAdmin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center">
                          <CheckCircle className="w-3 h-3 mr-1" /> Read
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 items-center">
                          <EyeIcon className="w-3 h-3 mr-1" /> Unread
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleReadStatus(item.id, item.isReadByAdmin)}
                        title={item.isReadByAdmin ? 'Mark as Unread' : 'Mark as Read'}
                        disabled={updatingFeedbackId === item.id} // Disable button for the item being updated
                        className={`p-1.5 rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
                                    ${item.isReadByAdmin ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {updatingFeedbackId === item.id ? (
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"></span>
                        ) : item.isReadByAdmin ? (
                          <EyeClosedIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                      {/* <button title="Add/Edit Note" className="p-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"><PencilSquareIcon className="w-4 h-4"/></button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* "Back to Admin Dashboard" link might be redundant if sidebar is always present */}
      {/* <div className="mt-8">
        <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 text-sm">
            &larr; Back to Admin Dashboard
        </Link>
      </div> */}
    </div>
  );
}
