// src/app/profile/donations/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DonationHistoryGraph, { DonationTimelineEvent } from '@/components/DonationHistoryGraph'; // Assuming DonationTimelineEvent is exported
import Link from 'next/link'; // For linking to details page if profile is missing
import HeaderSection from '@/components/atoms/Header';

// Type for individual donation record (can be shared)
interface DonationRecord {
  id: string;
  donationDate: string;
  location?: string | null;
  createdAt: string;
}

export default function UserDonationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // State to check if user has a donor profile
  const [donorProfileExists, setDonorProfileExists] = useState<boolean | null>(null); // null: not checked, true: exists, false: not exists
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // State for Donation History
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const [errorDonations, setErrorDonations] = useState<string | null>(null);
  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile/donations');
    }
  }, [sessionStatus, router]);

  // Check for Donor Profile and Fetch Initial History
  useEffect(() => {
    const checkProfileAndFetchHistory = async () => {
      if (sessionStatus === 'authenticated' && session?.user?.id) {
        setIsCheckingProfile(true);
        try {
          const profileResponse = await fetch('/api/user/profile/donor'); // GET request
          if (profileResponse.ok) {
            // const profile = await profileResponse.json(); // We don't strictly need its data here, just existence
            setDonorProfileExists(true);
            // If profile exists, fetch donation history
            await fetchDonationHistoryInternal();
          } else if (profileResponse.status === 404) {
            setDonorProfileExists(false);
            setDonations([]); // Clear any previous donations if profile is gone
          } else {
            throw new Error('Failed to check donor profile status.');
          }
        } catch (err: any) {
          console.error('Error checking donor profile:', err);
          setErrorDonations('Could not verify your donor profile. Please try again.'); // Use errorDonations for consistency
          setDonorProfileExists(null); // Error state
        } finally {
          setIsCheckingProfile(false);
        }
      }
    };
    checkProfileAndFetchHistory();
  }, [sessionStatus, session?.user?.id]); // Removed fetchDonationHistoryInternal from deps, it's called internally

  // Function to Fetch Donation History (internal, called after profile check or new donation)
  const fetchDonationHistoryInternal = useCallback(async () => {
    setIsLoadingDonations(true);
    setErrorDonations(null);
    try {
      const response = await fetch('/api/user/donations'); // GET request
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch donation history' }));
        throw new Error(errorData.message);
      }
      const data: DonationRecord[] = await response.json();
      setDonations(data);
    } catch (err: any) {
      console.error('Error fetching donation history:', err);
      setErrorDonations(err.message || 'Could not load your donation history.');
      setDonations([]);
    } finally {
      setIsLoadingDonations(false);
    }
  }, []); // No external dependencies, relies on session implicitly via API

  //   // Handler for Recording New Donation
  //   const handleRecordDonationSubmit = async (event: FormEvent<HTMLFormElement>) => {
  //     event.preventDefault();
  //     if (!newDonationDate) {
  //         setRecordDonationError("Please select a donation date.");
  //         return;
  //     }
  //     setIsRecordingDonation(true);
  //     setRecordDonationError(null);
  //     setRecordDonationSuccess(null);

  //     try {
  //         const response = await fetch('/api/user/donations', {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({
  //                 donationDate: new Date(newDonationDate).toISOString(),
  //                 location: newDonationLocation,
  //             }),
  //         });
  //         const result = await response.json();
  //         if (!response.ok) {
  //             throw new Error(result.message || 'Failed to record donation.');
  //         }
  //         setRecordDonationSuccess('Donation recorded successfully!');
  //         setNewDonationDate('');
  //         setNewDonationLocation('');
  //         await fetchDonationHistoryInternal(); // Refresh donation history list
  //     } catch (err: any) {
  //         setRecordDonationError(err.message);
  //     } finally {
  //         setIsRecordingDonation(false);
  //     }
  //   };

  // Process donation data for the graph using useMemo
  const donationTimelineData = useMemo((): DonationTimelineEvent[] => {
    if (!donations || donations.length === 0) return [];
    const sortedDonations = [...donations].sort(
      (a, b) => new Date(a.donationDate).getTime() - new Date(b.donationDate).getTime()
    );
    return sortedDonations.map((donation, index) => ({
      date: new Date(donation.donationDate).getTime(),
      donationNumber: index + 1,
      originalDate: new Date(donation.donationDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      location: donation.location || 'N/A',
    }));
  }, [donations]);

  // --- Render Logic ---
  if (sessionStatus === 'loading' || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        {' '}
        {/* Adjust height as needed */}
        <p className="text-lg text-indigo-600 animate-pulse">Loading donation activity...</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    // This will likely not be visible due to redirect, but good fallback
    return (
      <div className="text-center p-10">
        <p>Please log in to view this page.</p>
      </div>
    );
  }

  if (donorProfileExists === false) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Donor Profile Required</h2>
        <p className="text-gray-700 mb-6">
          To record donations and view your history, you first need to set up your donor details.
        </p>
        <Link
          href="/profile/details"
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Go to My Details
        </Link>
      </div>
    );
  }

  if (donorProfileExists === null && errorDonations) {
    // Error during profile check
    return (
      <div className="text-center p-6 bg-red-100 text-red-700 rounded-lg shadow-md">
        <p className="font-semibold">Could not load page:</p>
        <p>{errorDonations}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* <header>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Donation Activity</h1>
        <p className="text-md text-gray-600 mt-1">Track your contributions and plan your next donation.</p>
      </header> */}
      <HeaderSection
        title="My Donation Activity"
        subtitle="Track your contributions and plan your next donation."
      />

      {/* Display Donation History List & Graph */}
      <section className="p-6 bg-white rounded-lg shadow-xl space-y-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-1 border-b pb-3">
          Donation Log & Timeline
        </h2>

        {isLoadingDonations && <p className="text-gray-600 py-4">Loading your donation data...</p>}
        {errorDonations && !isCheckingProfile && (
          <p className="text-red-600 py-4">Could not load donation data: {errorDonations}</p>
        )}

        {!isLoadingDonations && !errorDonations && (
          <>
            {donations.length > 0 ? (
              <div className="mb-8 pt-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Donations Over Time</h3>
                <DonationHistoryGraph data={donationTimelineData} />
              </div>
            ) : (
              <p className="text-gray-600 py-4">No donation data yet to display a graph.</p>
            )}

            <h3 className="text-xl font-semibold text-gray-700 mb-4 mt-6">Recorded Donations</h3>
            {donations.length === 0 ? (
              <p className="text-gray-600">You haven't recorded any donations yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <p className="font-semibold text-gray-800">
                      Date:{' '}
                      {new Date(donation.donationDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {donation.location && (
                      <p className="text-sm text-gray-700">Location: {donation.location}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Logged:{' '}
                      {new Date(donation.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
