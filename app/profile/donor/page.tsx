// src/app/profile/donor/page.tsx (View My Details)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DonorProfileFormData } from '@/components/DonorProfileForm'; // Assuming DonorProfileFormData is exported
import HeaderSection from '@/components/atoms/Header';

// Helper to format blood group for display
const formatBloodGroupForDisplay = (bloodGroup?: string | null): string => {
  if (!bloodGroup) return 'N/A';
  return bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
};

export default function MyDetailsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [profileData, setProfileData] = useState<
    (DonorProfileFormData & { campusName?: string; groupName?: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile/donor');
    }
  }, [sessionStatus, router]);

  const fetchDonorProfile = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/profile/donor'); // GET user's donor profile
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
          campusId: data.campus?.id, // Keep IDs for consistency if needed elsewhere
          groupId: data.group?.id,
          campusName: data.campus?.name, // For display
          groupName: data.group?.name, // For display
          isAvailable: data.isAvailable,
        });
      } else if (response.status === 404) {
        setError('No donor profile found. Please create one.'); // Or redirect to /profile/edit
        setProfileData(null);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch profile' }));
        throw new Error(errorData.message);
      }
    } catch (err: any) {
      console.error('Error fetching donor profile:', err);
      setError(err.message || 'Could not load your donor profile.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session?.user?.id]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchDonorProfile();
    }
  }, [sessionStatus, fetchDonorProfile]);

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="text-center p-10">
        <p className="text-lg animate-pulse">Loading your details...</p>
      </div>
    );
  }
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="text-center p-10">
        <p>Please log in to view your details.</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Profile Error</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        {error.includes('No donor profile found') && (
          <Link
            href="/profile/edit"
            className="inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700"
          >
            Create Profile
          </Link>
        )}
      </div>
    );
  }
  if (!profileData) {
    return (
      <div className="text-center p-10">
        <p>No profile data to display. Consider creating one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeaderSection title="My Profile Details" />

      <section className="p-6 bg-white rounded-lg shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Blood Group</h3>
            <p className="mt-1 text-lg text-gray-900">
              {formatBloodGroupForDisplay(profileData.bloodGroup)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.contactNumber}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.email || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">District</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.district}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">City</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.city}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Campus/Institution</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.campusName || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Social Group</h3>
            <p className="mt-1 text-lg text-gray-900">{profileData.groupName || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Current Availability</h3>
            <p
              className={`mt-1 text-lg font-semibold ${profileData.isAvailable ? 'text-green-600' : 'text-red-600'}`}
            >
              {profileData.isAvailable ? 'Available for Donation' : 'Currently Unavailable'}
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit My Details & Availability
          </Link>
        </div>
      </section>
    </div>
  );
}
