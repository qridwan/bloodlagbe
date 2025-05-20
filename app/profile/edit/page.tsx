// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DonorProfileForm, { DonorProfileFormData } from '@/components/DonorProfileForm'; // Assuming DonorProfileFormData includes tagline
import AvailabilityToggle from '@/components/AvailabilityToggle';
import Link from 'next/link';
import useScrollOnMessage from '@/hooks/useScrollOnMessage';
import HeaderSection from '@/components/atoms/Header';

// Assuming these types are defined or imported, and DonorProfileFormData is updated
type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

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

// Ensure DonorProfileFormData (imported or defined in DonorProfileForm.tsx)
// includes: tagline?: string;

export default function EditProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [profileData, setProfileData] = useState<DonorProfileFormData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  useScrollOnMessage(error, successMessage);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile/edit');
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
          console.error('Error fetching filter options:', err);
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
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/user/profile/donor');
      if (response.ok) {
        const data = await response.json(); // API should return tagline if available
        setProfileData({
          id: data.id,
          name: data.name,
          bloodGroup: data.bloodGroup,
          contactNumber: data.contactNumber,
          email: data.email ?? '',
          district: data.district,
          city: data.city,
          campusId: data.campus?.id ?? '',
          groupId: data.group?.id ?? '',
          isAvailable: data.isAvailable,
          tagline: data.tagline ?? '', // Initialize tagline from fetched data
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
          tagline: '', // Default empty tagline for new profiles
        });
        setMode('create');
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch profile' }));
        throw new Error(errorData.message);
      }
    } catch (err: any) {
      console.error('Error fetching donor profile:', err);
      setError(err.message || 'Could not load your donor profile data.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session?.user?.id, session?.user?.name, session?.user?.email]);

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
      // formData now includes tagline from the DonorProfileForm component
      const response = await fetch('/api/user/profile/donor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // Send tagline in the body
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save profile.');
      }
      // Update local state with the potentially updated/created profile data
      setProfileData({
        id: result.id,
        name: result.name,
        bloodGroup: result.bloodGroup,
        contactNumber: result.contactNumber,
        email: result.email ?? '',
        district: result.district,
        city: result.city,
        campusId: result.campus?.id ?? formData.campusId,
        groupId: result.group?.id ?? formData.groupId,
        isAvailable: result.isAvailable,
        tagline: result.tagline ?? '', // Update tagline from API response
      });
      setMode('edit');
      setSuccessMessage('Profile saved successfully!');
      // router.push('/profile/donor'); // Optional: redirect to view page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvailabilityUpdate = async (newAvailability: boolean) => {
    // ... (this handler remains the same as before)
    if (!profileData || !profileData.id) {
      setError('Cannot update availability: profile does not exist or ID is missing.');
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
      setProfileData((prev) => (prev ? { ...prev, isAvailable: result.isAvailable } : null));
      setSuccessMessage(
        `Availability updated to ${result.isAvailable ? 'Available' : 'Unavailable'}.`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  // --- Render Logic ---
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="text-center p-10">
        <p className="text-lg animate-pulse">Loading profile editor...</p>
      </div>
    );
  }
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="text-center p-10">
        <p>Please log in to edit your profile.</p>
      </div>
    );
  }
  if (!filterOptions && !error) {
    return (
      <div className="text-center p-10">
        <p className="text-lg animate-pulse">Loading form options...</p>
      </div>
    );
  }
  if (error && !profileData && mode === 'create') {
    // Allow form display for 'create' mode even if initial fetch had unrelated error
    // but still show error. For 'edit' mode, error without profileData is more critical.
  } else if (error && !profileData) {
    return <div className="text-center p-10 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-0">
      <header className="flex justify-between items-center">
        <HeaderSection
          title={mode === 'edit' ? 'Edit Donor Profile' : 'Create Your Donor Profile'}
          className="mb-0"
        />
        {mode === 'edit' && (
          <Link href="/profile/donor" className="text-sm text-indigo-600 hover:text-indigo-800">
            &larr; My Details
          </Link>
        )}
      </header>

      {error && (
        <div className="p-3 my-2 rounded-md text-sm bg-red-100 text-red-700 shadow">
          <p className="font-semibold">Error:</p> <p>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="p-3 my-2 rounded-md text-sm bg-green-100 text-green-700 shadow">
          <p>{successMessage}</p>
        </div>
      )}

      <section className="p-6 bg-white rounded-lg shadow-xl">
        {mode === 'edit' && profileData && (
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Manage Availability</h2>
            <AvailabilityToggle
              initialIsAvailable={profileData.isAvailable}
              onAvailabilityChange={handleAvailabilityUpdate}
              isSaving={isUpdatingAvailability}
            />
          </div>
        )}

        {/* Render form if profileData is ready (for create or edit) and filterOptions are loaded */}
        {profileData && filterOptions ? (
          <DonorProfileForm
            initialData={profileData} // This will include tagline
            filterOptions={filterOptions}
            onSubmit={handleProfileSave}
            isSaving={isSavingProfile}
            mode={mode}
          />
        ) : (
          // Only show this if not covered by top-level isLoading or error for critical data
          !error && <p className="text-center text-gray-500">Loading form...</p>
        )}
      </section>
    </div>
  );
}
