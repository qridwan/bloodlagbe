// src/app/admin/groups/page.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PencilIcon, PlusCircleIcon, TrashIcon, UsersIcon } from 'lucide-react';

interface Group { // Changed from Campus to Group
	id: string;
	name: string;
	_count?: {
		donors: number;
	};
}

export default function ManageGroupsPage() { // Changed function name
	const { data: session, status: sessionStatus } = useSession();
	const router = useRouter();

	const [groups, setGroups] = useState<Group[]>([]); // Changed state name
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [currentGroup, setCurrentGroup] = useState<Group | null>(null); // Changed state name
	const [groupNameInput, setGroupNameInput] = useState(''); // Changed state name
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		if (sessionStatus === 'loading') return;
		if (sessionStatus === 'unauthenticated') {
			router.replace('/login?callbackUrl=/admin/groups'); // Updated callback URL
		} else if (session?.user?.role !== 'ADMIN') {
			router.replace('/');
		}
	}, [session, sessionStatus, router]);

	const fetchGroups = useCallback(async () => { // Changed function name
		if (session?.user?.role !== 'ADMIN') return;
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch('/api/admin/groups'); // Updated API endpoint
			if (!response.ok) {
				const errData = await response.json().catch(() => ({ message: "Failed to fetch groups" }));
				throw new Error(errData.message);
			}
			const data: Group[] = await response.json();
			setGroups(data); // Updated state setter
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, [session]);

	useEffect(() => {
		if (sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
			fetchGroups(); // Updated function call
		}
	}, [sessionStatus, session, fetchGroups]);

	const openModal = (mode: 'add' | 'edit', group?: Group) => { // Changed type to Group
		setModalMode(mode);
		setFormError(null);
		if (mode === 'edit' && group) {
			setCurrentGroup(group); // Updated state setter
			setGroupNameInput(group.name); // Updated state setter
		} else {
			setCurrentGroup(null); // Updated state setter
			setGroupNameInput(''); // Updated state setter
		}
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setGroupNameInput(''); // Updated state setter
		setCurrentGroup(null); // Updated state setter
		setFormError(null);
	};

	const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!groupNameInput?.trim()) {
			setFormError('Group name cannot be empty.'); // Updated message
			return;
		}
		setIsSubmitting(true);
		setFormError(null);

		const url = modalMode === 'add' ? '/api/admin/groups' : `/api/admin/groups/${currentGroup?.id}`; // Updated API endpoint
		const method = modalMode === 'add' ? 'POST' : 'PUT';

		try {
			const response = await fetch(url, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: groupNameInput?.trim() }),
			});
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || `Failed to ${modalMode} group.`); // Updated message
			}
			await fetchGroups(); // Updated function call
			closeModal();
		} catch (err: any) {
			setFormError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteGroup = async (groupId: string, groupName: string) => { // Changed param names
		if (!window.confirm(`Are you sure you want to delete group "${groupName}"? This action cannot be undone.`)) { // Updated message
			return;
		}
		setError(null);
		try {
			const response = await fetch(`/api/admin/groups/${groupId}`, { // Updated API endpoint
				method: 'DELETE',
			});
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete group.'); // Updated message
			}
			alert(result.message || 'Group deleted successfully.'); // Updated message
			await fetchGroups(); // Updated function call
		} catch (err: any) {
			setError(err.message);
			alert(`Error: ${err.message}`);
		}
	};


	if (isLoading && sessionStatus === 'authenticated' && !error) {
		return <div className="text-center p-10"><p className="text-lg animate-pulse text-sky-600">Loading Groups...</p></div>; // Updated message
	}
	if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') { /* ... */ }

	return (
		<div className="space-y-6">
			<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manage Social Groups</h1> {/* Updated title */}
					<p className="text-slate-600 mt-1 text-sm">Add, edit, or delete social group names.</p> {/* Updated description */}
				</div>
				<button
					onClick={() => openModal('add')}
					className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
				>
					<PlusCircleIcon className="w-5 h-5 mr-2" />
					Add New Group {/* Updated button text */}
				</button>
			</header>

			{error && <p className='text-red-800'>Something went wronng</p>}

			{!isLoading && !error && groups.length === 0 && ( // Changed state name
				<div className="text-center py-10 bg-white p-6 rounded-lg shadow-md">
					<UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" /> {/* Changed icon */}
					<p className="text-xl text-gray-500">No social groups found.</p> {/* Updated message */}
					<p className="text-sm text-gray-400 mt-2">Click "Add New Group" to get started.</p> {/* Updated message */}
				</div>
			)}

			{!isLoading && !error && groups.length > 0 && (
				<div className="bg-white shadow-xl rounded-lg overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Group Name</th> {/* Updated header */}
									<th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Donors Linked</th>
									<th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-slate-200">
								{groups.map((group) => (
									<tr key={group.id} className="hover:bg-sky-50/50">
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{group.name}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{group._count?.donors ?? 0}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
											<button
												onClick={() => openModal('edit', group)}
												title="Edit Group"
												className="p-1.5 rounded text-sky-600 hover:bg-sky-100 disabled:opacity-50"
											>
												<PencilIcon className="w-4 h-4" />
											</button>
											<button
												onClick={() => handleDeleteGroup(group.id, group.name)} // Changed variable name
												title="Delete Group" // Updated title
												disabled={(group._count?.donors ?? 0) > 0}
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
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
						<h2 className="text-xl font-semibold text-slate-800">
							{modalMode === 'add' ? 'Add New Group' : 'Edit Group'} {/* Updated title */}
						</h2>
						<form onSubmit={handleFormSubmit} className="space-y-4">
							<div>
								<label htmlFor="groupNameInput" className="block text-sm font-medium text-slate-700">
									Group Name <span className="text-red-500">*</span> {/* Updated label */}
								</label>
								<input
									type="text"
									id="groupNameInput" // Updated id
									value={groupNameInput} // Updated state variable
									onChange={(e) => setGroupNameInput(e.target.value)} // Updated state setter
									required
									className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
									disabled={isSubmitting}
								/>
							</div>
							{formError && <p className="text-xs text-red-600">{formError}</p>}
							<div className="flex justify-end space-x-3 pt-2">
								<button type="button" className='border p-2' onClick={closeModal} > Cancel </button>
								<button type="submit" className='border p-2 bg-blue-700 text-white' disabled={isSubmitting} >
									{isSubmitting ? (modalMode === 'add' ? 'Adding...' : 'Saving...') : (modalMode === 'add' ? 'Add Group' : 'Save Changes')} {/* Updated button text */}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
