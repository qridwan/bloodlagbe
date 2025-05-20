'use client';

import { useState, ChangeEvent, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Papa from 'papaparse'; // For client-side CSV parsing
import Link from 'next/link';

// Define the expected structure of a donor object from the CSV
// Matching the user's provided headers (snake_case)
interface ParsedDonor {
	name?: string;
	blood_group?: string; // Will be converted to BloodGroup enum on backend if approved
	contact_number?: string;
	email?: string;
	district?: string;
	city?: string;
	campus?: string;
	group?: string;
	is_available?: string; // Will be converted to boolean
	tagline?: string;
	[key: string]: any; // Allow other potential columns initially
}

// Expected CSV headers (snake_case as per user's example)
const EXPECTED_CSV_HEADERS_SNAKE_CASE = [
	'name',
	'blood_group',
	'contact_number',
	'email',
	'district',
	'city',
	'campus',
	'group',
	'is_available',
	'tagline',
];

// Helper to convert snake_case or space separated to camelCase for internal state if needed
// Or we can keep snake_case and ensure backend handles it.
// For now, let's parse as-is and the preview table will use snake_case keys.
// The `convertToCamelCase` function defined earlier can be used here if you want
// to transform headers during parsing.
function normalizeHeader(header: string): string {
	return header.trim().toLowerCase().replace(/\s+/g, '_');
}

export default function SubmitListPage() {
	const { data: session, status: sessionStatus } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams(); // To get query params
	const reviseId = searchParams.get('reviseId'); // Get submission ID for revision

	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<ParsedDonor[]>([]);
	const [headers, setHeaders] = useState<string[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);
	const [isParsing, setIsParsing] = useState(false);

	const [listName, setListName] = useState('');
	const [listNotes, setListNotes] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);
	const [isLoadingRevisionData, setIsLoadingRevisionData] = useState(false);
	const [originalAdminNotes, setOriginalAdminNotes] = useState<string | null>(null);

	useEffect(() => {
		if (sessionStatus === 'unauthenticated') {
			const callbackPath = reviseId
				? `/profile/my-list/submit?reviseId=${reviseId}`
				: '/profile/my-list/submit';
			router.replace(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
		}
	}, [sessionStatus, router, reviseId]);

	// Fetch data if revising
	useEffect(() => {
		if (reviseId && sessionStatus === 'authenticated') {
			setIsLoadingRevisionData(true);
			const fetchSubmissionForRevision = async () => {
				try {
					const response = await fetch(`/api/submissions/donor-lists/${reviseId}`);
					if (!response.ok) {
						const errData = await response
							.json()
							.catch(() => ({ message: 'Failed to load submission for revision.' }));
						throw new Error(errData.message);
					}
					const data = await response.json();
					setListName(data.listName || '');
					setListNotes(data.notes || '');
					// Ensure donorDataJson is an array
					let donorJsonData = data.donorDataJson;
					if (typeof donorJsonData === 'string') {
						try {
							donorJsonData = JSON.parse(donorJsonData);
						} catch (e) {
							donorJsonData = [];
						}
					}
					setParsedData(Array.isArray(donorJsonData) ? donorJsonData : []);
					// Dynamically set headers from the first object of the parsed data if available
					if (Array.isArray(donorJsonData) && donorJsonData.length > 0) {
						setHeaders(Object.keys(donorJsonData[0]).map(normalizeHeader));
					}
					setOriginalAdminNotes(data.adminNotes || null); // Display admin notes to user
				} catch (err: any) {
					setSubmitStatus({
						type: 'error',
						message: `Error loading revision data: ${err.message}`,
					});
				} finally {
					setIsLoadingRevisionData(false);
				}
			};
			fetchSubmissionForRevision();
		}
	}, [reviseId, sessionStatus]);

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		setParseError(null);
		setParsedData([]);
		setHeaders([]);
		setSubmitStatus(null);
		if (event.target.files && event.target.files[0]) {
			setCsvFile(event.target.files[0]);
		} else {
			setCsvFile(null);
		}
	};

	const handleParseCsv = () => {
		if (!csvFile) {
			setParseError('Please select a CSV file first.');
			return;
		}
		setIsParsing(true);
		setParseError(null);
		setSubmitStatus(null);

		Papa.parse(csvFile, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (header) => normalizeHeader(header), // Normalize to snake_case lowercase
			complete: (results) => {
				const processedHeaders = results.meta.fields as string[];
				setHeaders(processedHeaders);

				// Validate headers
				const missingHeaders = EXPECTED_CSV_HEADERS_SNAKE_CASE.filter(
					(expectedHeader) => !processedHeaders.includes(expectedHeader)
				);

				if (missingHeaders.length > 0) {
					setParseError(`Missing expected CSV headers: ${missingHeaders.join(', ')}. 
                         Please ensure your CSV has these headers (snake_case, lowercase): ${EXPECTED_CSV_HEADERS_SNAKE_CASE.join(', ')}`);
					setParsedData([]);
				} else {
					setParsedData(results.data as ParsedDonor[]);
				}
				setIsParsing(false);
			},
			error: (error) => {
				console.error('CSV Parsing Error:', error);
				setParseError(`Error parsing CSV file: ${error.message}`);
				setIsParsing(false);
				setParsedData([]);
				setHeaders([]);
			},
		});
	};

	// Placeholder for submitting the (potentially edited) parsedData
	const handleSubmitForReview = async (e: FormEvent) => {
		e.preventDefault()
		console.log({ parsedData });
		if (parsedData.length === 0 && !reviseId) {
			setSubmitStatus({ type: 'error', message: 'No data to submit. Please parse a valid CSV.' });
			return;
		}
		if (!listName.trim()) {
			setSubmitStatus({
				type: 'error',
				message: 'Please provide a name for your list submission.',
			});
			return;
		}

		setIsSubmitting(true);
		setSubmitStatus(null);

		// In a real scenario, `parsedData` would be the data from your editable table.
		const payload = {
			listName: listName.trim(),
			notes: listNotes.trim() || null, // Send null if empty
			donorDataJson: parsedData, // This is the array of donor objects
		};

		const apiPath = reviseId
			? `/api/submissions/donor-lists/${reviseId}`
			: '/api/submissions/donor-lists';
		const method = reviseId ? 'PUT' : 'POST';

		try {
			const response = await fetch(apiPath, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || `Failed to ${reviseId ? 'resubmit' : 'submit'} list.`);
			}
			setSubmitStatus({
				type: 'success',
				message: result.message || `List ${reviseId ? 'resubmitted' : 'submitted'} successfully!`,
			});

			if (reviseId) {
				// Redirect to "My Submissions" page after revising
				setTimeout(() => router.push('/profile/myContribution'), 1500);
			} else {
				// Clear form for new submission
				setParsedData([]);
				setCsvFile(null);
				setHeaders([]);
				const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
				if (fileInput) fileInput.value = '';
				setListName('');
				setListNotes('');
			}
		} catch (err: any) {
			setSubmitStatus({ type: 'error', message: err.message });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (sessionStatus === 'loading') {
		return (
			<div className="text-center p-10">
				<p className="animate-pulse">Loading...</p>
			</div>
		);
	}
	if (sessionStatus === 'unauthenticated') {
		return (
			<div className="text-center p-10">
				<p>Please log in to submit a donor list.</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-3xl md:text-4xl font-bold text-gray-800">
					{reviseId ? 'Revise and Resubmit Donor List' : 'Submit New Donor List for Review'}
				</h1>
				<p className="text-gray-600 mt-1">
					{reviseId &&
						'Please review the admin notes, make corrections to your list, and resubmit.'}
				</p>
				{!reviseId && (
					<div className="mt-6 border-t pt-4 text-sm text-gray-700">
						<h3 className="font-semibold text-gray-800 mb-2">📄 CSV Format Requirements</h3>
						<p className="mb-3 text-gray-600">
							Please ensure your CSV file includes the following headers, in the exact order shown below:
						</p>

						<div className="bg-slate-50 border rounded p-4 font-mono overflow-auto text-xs md:text-sm leading-relaxed">
							<p className="text-indigo-600 font-semibold mb-1">Required Headers:</p>
							<code>
								name, blood_group, contact_number, email, district, city, campus, group, is_available, tagline
							</code>

							<p className="mt-4 text-indigo-600 font-semibold">Example Row:</p>
							<code>
								Rahim Sheikh,O_POSITIVE,01711223344,rahim.s@example.com,Dhaka,Gulshan,University of Dhaka,Badhan,TRUE,CSE'2025
							</code>
						</div>

						<ul className="list-disc list-inside mt-4 space-y-1 text-gray-600">
							<li><strong>name</strong>: Full name of the donor.</li>
							<li><strong>blood_group</strong>: Valid blood type (e.g., A_POSITIVE, O_NEGATIVE).</li>
							<li><strong>contact_number</strong>: Phone number (e.g., 017xxxxxxxx).</li>
							<li><strong>email</strong>: Valid email address.(optional)</li>
							<li><strong>district</strong>: District name (e.g., Dhaka, Chattogram).</li>
							<li><strong>city</strong>: City or area (e.g., Gulshan, Uttara).</li>
							<li><strong>campus</strong>: Institution or university campus name(optional).</li>
							<li><strong>group</strong>: Name of donor group (e.g., Badhan, Medicine Club)(optional).</li>
							<li><strong>is_available</strong>: TRUE or FALSE — donor's availability status.</li>
							<li><strong>tagline</strong>: Additional info (e.g., 1st Batch, Dept. of CSE)(optional).</li>
						</ul>

						<p className="mt-4 text-sm text-gray-500">
							✅ <span className="text-green-600 font-medium">Pro Tip:</span> You can use Google Sheets or Excel to create your list and export it as a <code>.csv</code> file.
						</p>
					</div>
				)}
			</header>

			{submitStatus && (
				<div
					className={`p-4 mb-4 rounded-md text-sm ${submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
				>
					{submitStatus.message}
				</div>
			)}
			{originalAdminNotes && reviseId && (
				<div className="p-4 mb-6 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700">
					<h3 className="font-semibold text-yellow-800">Admin Feedback for Revision:</h3>
					<p className="whitespace-pre-wrap">{originalAdminNotes}</p>
				</div>
			)}
			<form
				onSubmit={handleSubmitForReview}
				className="p-6 bg-white rounded-lg shadow-xl space-y-6"
			>
				<div>
					<label htmlFor="listName" className="block text-sm font-medium text-gray-700">
						List Name / Source <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="listName"
						value={listName}
						onChange={(e) => setListName(e.target.value)}
						placeholder="e.g., BUET CSE Batch '20 Donors, XYZ Company Volunteers"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required
					/>
				</div>
				<div>
					<label htmlFor="listNotes" className="block text-sm font-medium text-gray-700">
						Notes (Optional)
					</label>
					<textarea
						id="listNotes"
						value={listNotes}
						onChange={(e) => setListNotes(e.target.value)}
						rows={3}
						placeholder="Any additional notes about this list, its source, or specific details for the admin."
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
				<div>
					{(!reviseId || parsedData.length === 0) && ( // Show file input for new or if revision data failed to load/cleared
						<div>
							<label htmlFor="csv-upload-input" className="block text-sm font-medium text-gray-700">
								Upload CSV File <span className="text-red-500">*</span>
							</label>
							<input
								type="file"
								id="csv-upload-input"
								accept=".csv"
								onChange={handleFileChange}
								className="mt-1 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100"
							/>
							{csvFile && !parsedData.length && (
								<button
									onClick={handleParseCsv}
									disabled={isParsing}
									className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
								>
									{isParsing ? 'Parsing...' : 'Preview & Prepare Data'}
								</button>
							)}
						</div>
					)}
				</div>
				{parseError && (
					<p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{parseError}</p>
				)}

				{parsedData.length > 0 && (
					<section className="p-6 bg-white rounded-lg shadow-xl space-y-4">
						<h2 className="text-xl font-semibold text-gray-700">
							Preview Data ({parsedData.length} records)
						</h2>
						<p className="text-sm text-gray-600">
							Below is a preview of your data. Currently, this view is read-only.
							{/* In the next step, we'll make this table editable. */}
						</p>
						<div className="overflow-x-auto max-h-[500px]">
							{' '}
							{/* Max height and scroll for table */}
							<table className="min-w-full divide-y divide-gray-200 text-sm">
								<thead className="bg-gray-100 sticky top-0">
									<tr>
										{headers.map((header) => (
											<th
												key={header}
												className="px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider"
											>
												{header.replace(/_/g, ' ')}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{parsedData.map((row, rowIndex) => (
										<tr key={rowIndex} className="hover:bg-gray-50">
											{headers.map((header) => (
												<td key={`${header}-${rowIndex}`} className="px-3 py-2 whitespace-nowrap">
													{String(row[header] ?? '')}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mt-6 pt-4 border-t">
							<button
								type="submit"
								disabled={isSubmitting || isParsing || (parsedData.length === 0 && !reviseId)}
								className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 disabled:bg-green-300"
							>
								{isSubmitting
									? 'Submitting...'
									: reviseId
										? 'Resubmit for Review'
										: 'Submit List for Admin Review'}
							</button>
						</div>
					</section>

				)}
				<div className="mt-8">
					<Link href="/profile/donor" className="text-sm text-indigo-600 hover:text-indigo-800">
						&larr; Back to My Profile
					</Link>
				</div>
			</form>
		</div>
	);
}
