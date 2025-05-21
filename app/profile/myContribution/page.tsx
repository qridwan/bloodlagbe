// src/app/profile/my-submissions/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
	CheckCircleIcon,
	ClipboardCheckIcon,
	Clock10Icon,
	PencilIcon,
	XCircleIcon,
} from 'lucide-react';

type SubmissionStatus = 'PENDING_REVIEW' | 'APPROVED_IMPORTED' | 'REJECTED' | 'NEEDS_REVISION';

interface UserSubmission {
	id: string;
	listName?: string | null;
	submittedAt: string;
	status: SubmissionStatus;
	adminNotes?: string | null;
}

export default function MySubmissionsPage() {
	const { status: sessionStatus } = useSession();
	const router = useRouter();

	const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (sessionStatus === 'unauthenticated') {
			router.replace('/login?callbackUrl=/profile/my-submissions');
		}
	}, [sessionStatus, router]);

	const fetchMySubmissions = useCallback(async () => {
		if (sessionStatus !== 'authenticated') return;
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch('/api/user/my-submissions');
			if (!response.ok) {
				const errData = await response
					.json()
					.catch(() => ({ message: 'Failed to load submissions' }));
				throw new Error(errData.message);
			}
			const data: UserSubmission[] = await response.json();
			setSubmissions(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, [sessionStatus]);

	useEffect(() => {
		if (sessionStatus === 'authenticated') {
			fetchMySubmissions();
		}
	}, [sessionStatus, fetchMySubmissions]);

	const getStatusPill = (status: SubmissionStatus) => {
		let IconComponent;
		let bgColor;
		let textColor;

		switch (status) {
			case 'PENDING_REVIEW':
				IconComponent = Clock10Icon;
				bgColor = 'bg-yellow-100';
				textColor = 'text-yellow-800';
				break;
			case 'APPROVED_IMPORTED':
				IconComponent = CheckCircleIcon;
				bgColor = 'bg-green-100';
				textColor = 'text-green-800';
				break;
			case 'REJECTED':
				IconComponent = XCircleIcon;
				bgColor = 'bg-red-100';
				textColor = 'text-red-800';
				break;
			case 'NEEDS_REVISION': // If you implement this status
				IconComponent = PencilIcon;
				bgColor = 'bg-blue-100';
				textColor = 'text-blue-800';
				break;
			default:
				IconComponent = Clock10Icon;
				bgColor = 'bg-gray-100';
				textColor = 'text-gray-800';
		}
		return (
			<span
				className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${bgColor} ${textColor}`}
			>
				<IconComponent className="w-4 h-4 mr-1.5" />
				{status.replace('_', ' ')}
			</span>
		);
	};

	if (isLoading || sessionStatus === 'loading') {
		return (
			<div className="text-center p-10">
				<p className="animate-pulse">Loading your submissions...</p>
			</div>
		);
	}

	if (error) {
		return <div className="text-center p-10 text-red-600">Error: {error}</div>;
	}

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Submitted Lists</h1>
				<p className="text-gray-600 mt-1">
					Track the status of your donor list submissions and revise if needed.
				</p>
			</header>

			{submissions.length === 0 && !isLoading && (
				<div className="text-center py-10 bg-white p-6 rounded-lg shadow-md">
					<ClipboardCheckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
					<p className="text-xl text-gray-500">You haven&apos;t submitted any donor lists yet.</p>
					<Link href="/profile/my-list/submit" legacyBehavior>
						<a className="mt-4 inline-block px-6 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700">
							Submit a New List
						</a>
					</Link>
				</div>
			)}

			{submissions.length > 0 && (
				<div className="bg-white shadow-xl rounded-lg overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
										List Name
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
										Submitted
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
										Status
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
										Admin Notes
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-slate-200">
								{submissions.map((sub) => (
									<tr key={sub.id} className="hover:bg-slate-50">
										<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">
											{sub.listName || 'Untitled'}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
											{new Date(sub.submittedAt).toLocaleDateString('en-GB', {
												day: '2-digit',
												month: 'short',
												year: 'numeric',
											})}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm">
											{getStatusPill(sub.status)}
										</td>
										<td
											className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate hover:whitespace-normal"
											title={sub.adminNotes || ''}
										>
											{sub.adminNotes || 'N/A'}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm">
											{sub.status === 'REJECTED' && (
												<Link
													href={`/profile/submitList?reviseId=${sub.id}`} // Link to revision page
													className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center"
												>
													<PencilIcon className="w-4 h-4 mr-1" /> Revise & Resubmit
												</Link>
											)}
											{(sub.status === 'PENDING_REVIEW' || sub.status === 'NEEDS_REVISION') && (
												<span className="text-xs text-gray-500 italic">Awaiting review</span>
											)}
											{sub.status === 'APPROVED_IMPORTED' && (
												<span className="text-xs text-green-600 font-semibold">Approved</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
			<div className="mt-6">
				<Link
					href="/profile/submitList"
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
				>
					Submit Another List
				</Link>
			</div>
		</div>
	);
}
