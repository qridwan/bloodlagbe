// src/app/admin/campuses/page.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building2Icon, PencilIcon, PlusCircleIcon, TrashIcon } from 'lucide-react';

interface Campus {
  id: string;
  name: string;
  _count?: {
    donors: number;
  };
}

export default function ManageCampusesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For fetching errors

  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentCampus, setCurrentCampus] = useState<Campus | null>(null); // For editing
  const [campusNameInput, setCampusNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // For form submission errors

  // Authorization check (though AdminLayout also handles this)
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin/campuses');
    } else if (session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [session, sessionStatus, router]);

  const fetchCampuses = useCallback(async () => {
    if (session?.user?.role !== 'ADMIN') return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/campuses');
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch campuses' }));
        throw new Error(errData.message);
      }
      const data: Campus[] = await response.json();
      setCampuses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchCampuses();
    }
  }, [sessionStatus, session, fetchCampuses]);

  const openModal = (mode: 'add' | 'edit', campus?: Campus) => {
    setModalMode(mode);
    setFormError(null);
    if (mode === 'edit' && campus) {
      setCurrentCampus(campus);
      setCampusNameInput(campus.name);
    } else {
      setCurrentCampus(null);
      setCampusNameInput('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCampusNameInput('');
    setCurrentCampus(null);
    setFormError(null);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campusNameInput.trim()) {
      setFormError('Campus name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const url =
      modalMode === 'add' ? '/api/admin/campuses' : `/api/admin/campuses/${currentCampus?.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: campusNameInput.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Failed to ${modalMode} campus.`);
      }
      await fetchCampuses(); // Refresh list
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampus = async (campusId: string, campusName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete campus "${campusName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    // Use a specific loading state for delete if needed, or a general one
    // For now, we'll rely on the main list isLoading during fetchCampuses
    setError(null); // Clear main error display
    try {
      const response = await fetch(`/api/admin/campuses/${campusId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete campus.');
      }
      alert(result.message || 'Campus deleted successfully.'); // Simple feedback
      await fetchCampuses(); // Refresh list
    } catch (err: any) {
      setError(err.message); // Display error on the page
      alert(`Error: ${err.message}`); // Also alert for immediate feedback
    }
  };

  if (isLoading && sessionStatus === 'authenticated' && !error) {
    // Initial load
    return (
      <div className="text-center p-10">
        <p className="text-lg animate-pulse text-sky-600">Loading Campuses...</p>
      </div>
    );
  }

  // Fallback for auth issues, though layout usually handles it
  if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="text-center p-10">
        <p className="text-xl text-red-600">Access Denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manage Campuses</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Add, edit, or delete campus/institution names.
          </p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add New Campus
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
          <p className="font-semibold">Error:</p> <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && campuses.length === 0 && (
        <div className="text-center py-10 bg-white p-6 rounded-lg shadow-md">
          <Building2Icon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-500">No campuses found.</p>
          <p className="text-sm text-gray-400 mt-2">Click "Add New Campus" to get started.</p>
        </div>
      )}

      {!isLoading && !error && campuses.length > 0 && (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Campus Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Donors Linked
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {campuses.map((campus) => (
                  <tr key={campus.id} className="hover:bg-sky-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {campus.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {campus._count?.donors ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                      <button
                        onClick={() => openModal('edit', campus)}
                        title="Edit Campus"
                        className="p-1.5 rounded text-sky-600 hover:bg-sky-100 disabled:opacity-50"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampus(campus.id, campus.name)}
                        title="Delete Campus"
                        disabled={(campus._count?.donors ?? 0) > 0} // Disable if donors are linked
                        className="p-1.5 rounded text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4 transform transition-all duration-300 ease-in-out scale-100">
            <h2 className="text-xl font-semibold text-slate-800">
              {modalMode === 'add' ? 'Add New Campus' : 'Edit Campus'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="campusNameInput"
                  className="block text-sm font-medium text-slate-700"
                >
                  Campus Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="campusNameInput"
                  value={campusNameInput}
                  onChange={(e) => setCampusNameInput(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  disabled={isSubmitting}
                />
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300"
                >
                  {isSubmitting
                    ? modalMode === 'add'
                      ? 'Adding...'
                      : 'Saving...'
                    : modalMode === 'add'
                      ? 'Add Campus'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
