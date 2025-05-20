// src/app/profile/layout.tsx
'use client'; // This layout needs to be a client component to manage sidebar state

import { useState, ReactNode, useEffect } from 'react';
import ProfileSidebar from '@/components/ProfileSidebar';
import { useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation'; // Use for client-side redirect if needed

export default function ProfileLayout({ children }: { children: ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar
	const { data: session, status } = useSession();
	const pathname = usePathname();
	// Determine header title based on pathname
	const getHeaderTitle = () => {
		switch (pathname) {
			case '/profile/donor':
				return 'My Details';
			case '/profile/edit':
				return 'Edit Profile';
			case '/profile/donation/add':
				return 'Add Donation Record';
			case '/profile/donations':
				return 'Donation Activity';
			default:
				return 'My Profile';
		}
	};

	useEffect(() => {
		if (status === 'unauthenticated') {
			redirect('/login?callbackUrl=/profile/donor'); // Or current path
		}
	}, [status]);

	if (status === 'loading') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-lg text-indigo-600">Loading profile area...</p>
			</div>
		);
	}

	if (status === 'unauthenticated') {
		// This will likely not be shown due to the redirect in useEffect, but as a fallback.
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-lg text-red-600">Please log in to access your profile.</p>
			</div>
		);
	}

	return (
		<div className="min-h-[70vh] bg-gray-100">
			{/* Parent flex container */}
			<ProfileSidebar isOpen={sidebarOpen} toggleSidebar={(prev: boolean) => setSidebarOpen(!prev)} />
			{/* Main content area. MUST have margin-left on desktop to make space for the sidebar */}
			<div className="md:flex md:flex-col md:ml-2 overflow-hidden w-full">
				{' '}
				{/* overflow-hidden was here, let's test without it on this wrapper */}
				{/* Mobile header */}
				<header className="bg-white shadow-md md:hidden sticky top-0 z-30">
					<div className="container mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<span className="text-xl font-bold text-red-600">{getHeaderTitle()}</span>
							<button
								onClick={() => setSidebarOpen(true)}
								className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
								aria-controls="profile-sidebar"
								aria-expanded={sidebarOpen}
							>
								<span className="sr-only">Open sidebar</span>
								<svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				</header>
				{/* This is where the actual page content scrolls */}
				<main className="flex-1 overflow-y-auto pt-20 p-4 md:p-6 lg:p-8">{children}</main>
			</div>
			{/* Overlay for mobile when sidebar is open */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
					onClick={() => setSidebarOpen(false)}
					aria-hidden="true"
				/>
			)}
		</div>
	);
}
