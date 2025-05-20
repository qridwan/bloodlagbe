/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/donors/page.tsx
'use client';

import DonorFilters from '@/components/DonorFilters';
import DonorTable from '@/components/DonorTable';
import PaginationControls from '@/components/PaginationControls';
import { useState, useEffect, useCallback } from 'react';
// We'll create these components in the next steps
// import DonorFilters from '@/components/DonorFilters';
// import DonorTable from '@/components/DonorTable';
// import PaginationControls from '@/components/PaginationControls';

// --- Define Types/Interfaces ---
interface Campus {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

// This should match Prisma.BloodGroup but defined here for client-side use
// Or import directly from Prisma if you set up path aliases for shared types (more advanced)
type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  contactNumber: string;
  email?: string | null;
  district: string;
  city: string;
  isAvailable: boolean;
  campus: Campus; // Included from relation
  group: Group; // Included from relation
  updatedAt: string; // Or Date, depending on how you want to handle it
}

interface FilterOptions {
  campuses: Campus[];
  groups: Group[];
  bloodGroups: { id: BloodGroup; name: string }[];
}

interface ActiveFilters {
  bloodGroup?: BloodGroup | '';
  campusId?: string | '';
  groupId?: string | '';
  city?: string | '';
  district?: string | '';
  availability?: 'true' | 'false' | '';
  name?: string | '';
  // Add other filterable fields as needed
}

interface PaginationState {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({}); // Initialize as an empty object
  const [pagination, setPagination] = useState<PaginationState>({
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10, // Should match backend default or be configurable
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Filter Options (Campuses, Groups, BloodGroups) ---
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/filters/options');
        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }
        const data = await response.json();
        setFilterOptions(data);
      } catch (err: any) {
        console.error('Error fetching filter options:', err);
        // setError('Could not load filter options. Please try refreshing.'); // Optional: specific error for options
      }
    };
    fetchOptions();
  }, []);

  // --- Fetch Donors Data ---
  const fetchDonors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (activeFilters.bloodGroup) queryParams.append('bloodGroup', activeFilters.bloodGroup);
    if (activeFilters.campusId) queryParams.append('campusId', activeFilters.campusId);
    if (activeFilters.groupId) queryParams.append('groupId', activeFilters.groupId);
    if (activeFilters.city) queryParams.append('city', activeFilters.city);
    if (activeFilters.district) queryParams.append('district', activeFilters.district);
    if (activeFilters.availability) queryParams.append('availability', activeFilters.availability);
    if (activeFilters.name) queryParams.append('name', activeFilters.name);

    queryParams.append('page', pagination.currentPage.toString());
    queryParams.append('limit', pagination.itemsPerPage.toString());

    try {
      const response = await fetch(`/api/donors?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch donor data' }));
        throw new Error(errorData.message || 'Failed to fetch donor data');
      }
      const data = await response.json();
      setDonors(data.donors);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Could not load donor data. Please try again.');
      setDonors([]); // Clear donors on error
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, pagination.currentPage, pagination.itemsPerPage]); // Dependencies

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]); // Call fetchDonors when it (or its dependencies) changes

  // --- Handler for Filter Changes ---
  const handleFilterChange = (newFilters: Partial<ActiveFilters>) => {
    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
  };

  // --- Handler for Page Changes ---
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // --- Render Logic ---
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Find a Blood Donor</h1>
        <p className="text-lg text-gray-600 mt-2">
          Search for available donors based on location, blood group, and more.
        </p>
      </header>

      {/* Filters Section - Updated */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Filter Donors</h2>
        <DonorFilters
          options={filterOptions}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          isLoading={isLoading && !filterOptions} // Disable filters if options OR main data is loading
        />
        {/* For debugging, you can still show active filters: */}
        {/* <pre className="mt-2 p-2 bg-gray-200 text-xs rounded">
          Active Filters: {JSON.stringify(activeFilters, null, 2)}
        </pre> */}
      </div>

      {/* Donors Table Section - Updated */}
      {isLoading && (
        <div className="text-center py-10">
          <p className="text-lg text-indigo-600">Loading donors...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-10 p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => fetchDonors()} // fetchDonors is already memoized by useCallback
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && donors.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No donors found matching your criteria.</p>
        </div>
      )}

      {!isLoading && !error && donors.length > 0 && (
        // Replace the old placeholder with the DonorTable component
        <DonorTable donors={donors} />
      )}

      {/* Pagination Controls - Updated */}
      {!isLoading && !error && donors.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8">
          {' '}
          {/* Removed flex justify-center, handled by component */}
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading} // Pass isLoading to disable controls during fetch
          />
        </div>
      )}
    </div>
  );
}
