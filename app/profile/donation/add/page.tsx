// src/app/profile/donation/add/page.tsx
'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useScrollOnMessage from '@/hooks/useScrollOnMessage';
import HeaderSection from '@/components/atoms/Header';

export default function AddDonationRecordPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // State to check if user has a donor profile
  const [donorProfileExists, setDonorProfileExists] = useState<boolean | null>(null); // null: not checked, true: exists, false: not exists
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileCheckError, setProfileCheckError] = useState<string | null>(null);

  // State for New Donation Form
  const [donationDate, setDonationDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  useScrollOnMessage(submitError, submitSuccessMessage);

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile/donation/add');
    }
  }, [sessionStatus, router]);

  // Check for Donor Profile
  useEffect(() => {
    const checkDonorProfile = async () => {
      if (sessionStatus === 'authenticated' && session?.user?.id) {
        setIsCheckingProfile(true);
        setProfileCheckError(null);
        try {
          const profileResponse = await fetch('/api/user/profile/donor'); // GET request
          if (profileResponse.ok) {
            setDonorProfileExists(true);
          } else if (profileResponse.status === 404) {
            setDonorProfileExists(false);
          } else {
            const errorData = await profileResponse
              .json()
              .catch(() => ({ message: 'Failed to verify donor profile.' }));
            throw new Error(errorData.message);
          }
        } catch (err: any) {
          console.error('Error checking donor profile:', err);
          setProfileCheckError(
            err.message || 'Could not verify your donor profile. Please try again.'
          );
          setDonorProfileExists(null); // Error state
        } finally {
          setIsCheckingProfile(false);
        }
      } else if (sessionStatus === 'unauthenticated') {
        setIsCheckingProfile(false); // No need to check if not authenticated
      }
    };
    checkDonorProfile();
  }, [sessionStatus, session?.user?.id]);

  // Handler for Recording New Donation
  const handleRecordDonationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!donationDate) {
      setSubmitError('Please select a donation date.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMessage(null);

    try {
      const response = await fetch('/api/user/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationDate: new Date(donationDate).toISOString(),
          location: location,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to record donation.');
      }
      setSubmitSuccessMessage('Donation recorded successfully! Redirecting...');
      setDonationDate(''); // Clear form
      setLocation('');
      // Redirect to donation activity page after a short delay
      setTimeout(() => {
        router.push('/profile/donations');
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (sessionStatus === 'loading' || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-lg text-indigo-600 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="text-center p-10">
        <p>Please log in to add a donation record.</p>
      </div>
    );
  }

  if (profileCheckError) {
    return (
      <div className="text-center p-6 bg-red-100 text-red-700 rounded-lg shadow-md">
        <p className="font-semibold">Could not load page:</p>
        <p>{profileCheckError}</p>
      </div>
    );
  }

  if (donorProfileExists === false) {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-semibold text-red-600">Donor Profile Required</h1>
        <p className="text-gray-700">
          To record a new donation, you first need to complete your donor details.
        </p>
        <Link
          href="/profile/edit"
          className="inline-block px-8 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Complete Your Donor Details
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeaderSection
        title="Add New Donation Record"
        subtitle="Log your recent blood donation to keep your history up-to-date."
      />
      {submitError && (
        <div className="p-3 my-2 rounded-md text-sm bg-red-100 text-red-700 shadow">
          <p className="font-semibold">Error:</p> <p>{submitError}</p>
        </div>
      )}
      {submitSuccessMessage && (
        <div className="p-3 my-2 rounded-md text-sm bg-green-100 text-green-700 shadow">
          <p>{submitSuccessMessage}</p>
        </div>
      )}

      <section className="p-6 bg-white rounded-lg shadow-xl max-w-lg mx-auto">
        <form onSubmit={handleRecordDonationSubmit} className="space-y-6">
          <div>
            <label htmlFor="donationDate" className="block text-sm font-medium text-gray-700">
              Donation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="donationDate"
              name="donationDate"
              value={donationDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDonationDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location (e.g., Hospital, Donation Camp)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={location}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              placeholder="Enter where you donated"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting Record...' : 'Submit Donation Record'}
          </button>
        </form>
      </section>
    </div>
  );
}
