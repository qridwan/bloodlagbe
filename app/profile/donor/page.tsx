// src/app/profile/donor/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DonorProfileForm, { DonorProfileFormData } from '@/components/DonorProfileForm';
import AvailabilityToggle from '@/components/AvailabilityToggle';

// --- Define Types/Interfaces (Ideally from a shared types file) ---
type BloodGroup =
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'
  | 'O_POSITIVE' | 'O_NEGATIVE';

interface Campus {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface FilterOptions {
  campuses: Campus[];
  groups: Group[];
  bloodGroups: { id: BloodGroup; name: string }[];
}

// The main state for profile data is DonorProfileFormData from the form component
// export interface DonorProfileFormData { ... } // This is now imported from DonorProfileForm

export default function DonorProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [profileData, setProfileData] = useState<DonorProfileFormData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false); // Specific for profile form
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false); // Specific for availability
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile/donor');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchOptions = async () => {
        try {
          const response = await fetch('/api/filters/options');
          if (!response.ok) throw new Error('Failed to fetch filter options');
          const data: FilterOptions = await response.json();
          setFilterOptions(data);
        } catch (err: any) {
          console.error("Error fetching filter options:", err);
          setError('Could not load filter options for the form.');
        }
      };
      fetchOptions();
    }
  }, [sessionStatus]);

  const fetchDonorProfile = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); // Clear previous success messages
    try {
      const response = await fetch('/api/user/profile/donor');
      if (response.ok) {
        const data = await response.json();
        setProfileData({
            id: data.id,
            name: data.name,
            bloodGroup: data.bloodGroup,
            contactNumber: data.contactNumber,
            email: data.email || '',
            district: data.district,
            city: data.city,
            campusId: data.campus.id,
            groupId: data.group.id,
            isAvailable: data.isAvailable,
        });
        setMode('edit');
      } else if (response.status === 404) {
        setProfileData({
            name: session.user.name || '',
            email: session.user.email || '',
            bloodGroup: '',
            contactNumber: '',
            district: '',
            city: '',
            campusId: '',
            groupId: '',
            isAvailable: true,
        });
        setMode('create');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
        throw new Error(errorData.message);
      }
    } catch (err: any) {
      console.error("Error fetching donor profile:", err);
      setError(err.message || 'Could not load your donor profile.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session?.user?.name, session?.user?.email, session?.user?.id]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchDonorProfile();
    }
  }, [sessionStatus, fetchDonorProfile]);

  const handleProfileSave = async (formData: DonorProfileFormData) => {
    setIsSavingProfile(true);
    setError(null);
    setSuccessMessage(null);
    try {
        const response = await fetch('/api/user/profile/donor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save profile.');
        }
        // Update local state with saved data which now includes campus/group objects if API returns them
        // For simplicity, re-fetching to get fully populated nested objects if API returns flat IDs for connect
        await fetchDonorProfile(); // Re-fetch ensures full consistency
        setSuccessMessage('Profile saved successfully!');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleAvailabilityUpdate = async (newAvailability: boolean) => {
    if (!profileData || !profileData.id) { // Ensure profile exists before updating availability
        setError("Cannot update availability: profile does not exist.");
        return;
    }
    setIsUpdatingAvailability(true);
    setError(null);
    setSuccessMessage(null);
    try {
        const response = await fetch('/api/user/profile/donor/availability', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAvailable: newAvailability }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update availability.');
        }
        setProfileData(prev => prev ? { ...prev, isAvailable: result.isAvailable } : null);
        setSuccessMessage(`Availability updated to ${result.isAvailable ? 'Available' : 'Unavailable'}.`);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsUpdatingAvailability(false);
    }
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && isLoading && !profileData)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-indigo-600">Loading your profile...</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-red-600">Please log in to manage your donor profile.</p>
        {/* Optionally add a Link to login */}
      </div>
    );
  }

  // If authenticated but still loading critical options and no error yet
  if (sessionStatus === 'authenticated' && (!filterOptions && !error)) {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <p className="text-lg text-indigo-600">Preparing profile editor...</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          {mode === 'edit' ? 'Edit Your Donor Profile' : 'Create Your Donor Profile'}
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Keep your information up-to-date to help save lives.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-md text-sm bg-red-100 text-red-700 shadow">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 rounded-md text-sm bg-green-100 text-green-700 shadow">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Availability Toggle Section */}
      {mode === 'edit' && profileData && ( // Only show if profile exists (edit mode)
        <div className="mb-6 p-1"> {/* Adjusted padding */}
          {/* <h2 className="text-xl font-semibold text-gray-700 mb-3">Donation Availability</h2> */}
          <AvailabilityToggle
            initialIsAvailable={profileData.isAvailable}
            onAvailabilityChange={handleAvailabilityUpdate}
            isSaving={isUpdatingAvailability}
          />
        </div>
      )}

      {/* Profile Form Section */}
      {profileData && filterOptions ? (
        <div className="p-6 bg-white rounded-lg shadow-xl"> {/* Added more padding and shadow */}
          <DonorProfileForm
            initialData={profileData}
            filterOptions={filterOptions}
            onSubmit={handleProfileSave}
            isSaving={isSavingProfile}
            mode={mode}
          />
        </div>
      ) : (
        !error && <p className="text-center text-gray-500">Loading form data...</p>
      )}
    </div>
  );
}