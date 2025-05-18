/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DonorProfileForm, { DonorProfileFormData } from '@/components/DonorProfileForm';
import AvailabilityToggle from '@/components/AvailabilityToggle';
import Link from 'next/link';
import useScrollOnMessage from '@/hooks/useScrollOnMessage';

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

// --- ADDED: Type for individual donation record ---
interface DonationRecord {
	id: string;
	donationDate: string;
	location?: string | null;
	createdAt: string;
}

export default function DonorProfilePage() {
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

	// --- ADDED: State for Donation History ---
	const [donations, setDonations] = useState<DonationRecord[]>([]);
	const [isLoadingDonations, setIsLoadingDonations] = useState(false);
	const [errorDonations, setErrorDonations] = useState<string | null>(null); // Specific error for donations

	// --- ADDED: State for New Donation Form ---
	const [newDonationDate, setNewDonationDate] = useState('');
	const [newDonationLocation, setNewDonationLocation] = useState('');
	const [isRecordingDonation, setIsRecordingDonation] = useState(false);
	const [recordDonationError, setRecordDonationError] = useState<string | null>(null);

	// --- This will scroll to the top of the page when there's an error or success message
	useScrollOnMessage(error, successMessage)

	// --- Existing useEffects and handlers ---
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
		setError(null); // Clear general error
		setSuccessMessage(null);
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
					campusId: data.campus?.id ?? '', // Handle potentially null campus/group
					groupId: data.group?.id ?? '',   // if profile was created before these were mandatory
					isAvailable: data.isAvailable,
				});
				setMode('edit');
			} else if (response.status === 404) {
				setProfileData({
					name: session.user.name || '',
					email: session.user.email || '',
					bloodGroup: '', contactNumber: '', district: '', city: '',
					campusId: '', groupId: '', isAvailable: true,
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
	}, [sessionStatus, session?.user?.id, session?.user?.name, session?.user?.email]); // Added session.user.id dependency

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
			await fetchDonorProfile(); // Re-fetch for consistency
			setSuccessMessage('Profile saved successfully!');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsSavingProfile(false);
		}
	};

	const handleAvailabilityUpdate = async (newAvailability: boolean) => {
		if (!profileData || !profileData.id) {
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

	// --- ADDED: Function to Fetch Donation History ---
	const fetchDonationHistory = useCallback(async () => {
		if (sessionStatus !== 'authenticated' || mode !== 'edit' || !profileData?.id) {
			setDonations([]); // Clear donations if not in edit mode or no profile ID
			return;
		}

		setIsLoadingDonations(true);
		setErrorDonations(null);
		try {
			const response = await fetch('/api/user/donations'); // GET request
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Failed to fetch donation history' }));
				throw new Error(errorData.message);
			}
			const data: DonationRecord[] = await response.json();
			setDonations(data);
		} catch (err: any) {
			console.error("Error fetching donation history:", err);
			setErrorDonations(err.message || 'Could not load your donation history.');
			setDonations([]);
		} finally {
			setIsLoadingDonations(false);
		}
	}, [sessionStatus, mode, profileData?.id]); // Depend on mode and profileData.id

	// Fetch history when component mounts or mode changes to 'edit' and profileData.id is available
	useEffect(() => {
		if (mode === 'edit' && profileData?.id) {
			fetchDonationHistory();
		}
	}, [mode, profileData?.id, fetchDonationHistory]); // Added profileData.id

	// --- ADDED: Handler for Recording New Donation ---
	const handleRecordDonationSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!newDonationDate) {
			setRecordDonationError("Please select a donation date.");
			return;
		}
		setIsRecordingDonation(true);
		setRecordDonationError(null);
		setSuccessMessage(null); // Clear previous general success messages

		try {
			const response = await fetch('/api/user/donations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					// Ensure date is sent in a format your backend expects (e.g., ISO string or just YYYY-MM-DD)
					// HTML date input value is typically 'YYYY-MM-DD'
					donationDate: new Date(newDonationDate).toISOString(),
					location: newDonationLocation,
				}),
			});
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || 'Failed to record donation.');
			}
			setSuccessMessage('Donation recorded successfully!'); // General success message
			setNewDonationDate(''); // Clear form
			setNewDonationLocation('');
			await fetchDonationHistory(); // Refresh donation history list
		} catch (err: any) {
			setRecordDonationError(err.message);
		} finally {
			setIsRecordingDonation(false);
		}
	};


	// --- Render Logic (Loading states first) ---
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
				<Link href="/login" className="text-blue-600 hover:underline">Login</Link>
			</div>
		);
	}

	if (sessionStatus === 'authenticated' && !filterOptions && !error && !profileData) {
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<p className="text-lg text-indigo-600">Preparing profile editor...</p>
			</div>
		);
	}

	return (
		// Added space-y-10 for spacing between sections
		<div className="container mx-auto px-4 py-8 space-y-10">
			<header className="mb-0"> {/* Reduced mb from header as sections will have their own margins */}
				<h1 className="text-4xl font-bold text-gray-800">
					{mode === 'edit' ? 'Edit Your Donor Profile' : 'Create Your Donor Profile'}
				</h1>
				<p className="text-lg text-gray-600 mt-2">
					Keep your information up-to-date to help save lives.
				</p>
			</header>

			{/* General Error and Success Messages */}
			{error && ( /* For profile fetch/save errors */
				<div className="p-3 rounded-md text-sm bg-red-100 text-red-700 shadow">
					<p className="font-semibold">Error:</p> <p>{error}</p>
				</div>
			)}
			{successMessage && (
				<div className="p-3 rounded-md text-sm bg-green-100 text-green-700 shadow">
					<p>{successMessage}</p>
				</div>
			)}

			{/* Profile Form and Availability Section */}
			<section className="p-6 bg-white rounded-lg shadow-xl">
				<h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">My Details</h2>
				{mode === 'edit' && profileData && (
					<div className="mb-6">
						<AvailabilityToggle
							initialIsAvailable={profileData.isAvailable}
							onAvailabilityChange={handleAvailabilityUpdate}
							isSaving={isUpdatingAvailability}
						/>
					</div>
				)}

				{profileData && filterOptions ? (
					<DonorProfileForm
						initialData={profileData}
						filterOptions={filterOptions}
						onSubmit={handleProfileSave}
						isSaving={isSavingProfile}
						mode={mode}
					/>
				) : (
					!error && <p className="text-center text-gray-500">Loading form data...</p>
				)}
			</section>

			{/* --- ADDED: Donation History and Recording Section (Only if profile exists - mode === 'edit') --- */}
			{mode === 'edit' && profileData?.id && ( // Ensure profile and its ID exist
				<section className="p-6 bg-white rounded-lg shadow-xl space-y-8">
					{/* Record New Donation Form */}
					<div>
						<h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-3">Record New Donation</h2>
						{recordDonationError && (
							<div className="mb-4 p-3 rounded-md text-sm bg-red-100 text-red-700">
								<p className="font-semibold">Error recording donation:</p> <p>{recordDonationError}</p>
							</div>
						)}
						<form onSubmit={handleRecordDonationSubmit} className="space-y-4 max-w-md">
							<div>
								<label htmlFor="newDonationDate" className="block text-sm font-medium text-gray-700">
									Donation Date <span className="text-red-500">*</span>
								</label>
								<input
									type="date"
									id="newDonationDate"
									name="newDonationDate"
									value={newDonationDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDonationDate(e.target.value)}
									required
									max={new Date().toISOString().split("T")[0]} // Prevent future dates
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									disabled={isRecordingDonation}
								/>
							</div>
							<div>
								<label htmlFor="newDonationLocation" className="block text-sm font-medium text-gray-700">
									Location (e.g., Hospital, Camp)
								</label>
								<input
									type="text"
									id="newDonationLocation"
									name="newDonationLocation"
									value={newDonationLocation}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDonationLocation(e.target.value)}
									placeholder="Enter donation location"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									disabled={isRecordingDonation}
								/>
							</div>
							<button
								type="submit"
								disabled={isRecordingDonation}
								className="px-4 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed"
							>
								{isRecordingDonation ? 'Recording...' : 'Add Donation Record'}
							</button>
						</form>
					</div>

					{/* Display Donation History List */}
					<div>
						<h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-3">My Donation History</h2>
						{isLoadingDonations && <p className="text-gray-600">Loading your donation history...</p>}
						{errorDonations && <p className="text-red-600">Could not load history: {errorDonations}</p>}
						{!isLoadingDonations && !errorDonations && donations.length === 0 && (
							<p className="text-gray-600">You haven&apos;t recorded any donations yet.</p>
						)}
						{!isLoadingDonations && !errorDonations && donations.length > 0 && (
							<div className="max-h-96 overflow-y-auto space-y-3 pr-2"> {/* Scrollable list */}
								{donations.map((donation) => (
									<div key={donation.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
										<p className="font-semibold text-gray-800">
											{/* Using en-CA for YYYY-MM-DD consistently, or choose your preferred locale */}
											Date: {new Date(donation.donationDate).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })}
										</p>
										{donation.location && (
											<p className="text-sm text-gray-700">Location: {donation.location}</p>
										)}
										<p className="text-xs text-gray-500 mt-1">
											Added on: {new Date(donation.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				</section>
			)}
		</div>
	);
}