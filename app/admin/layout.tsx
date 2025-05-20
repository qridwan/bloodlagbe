// src/app/admin/layout.tsx
'use client';

import { useState, ReactNode, useEffect } from 'react';
import AdminSidebar, { adminNavigationItems } from '@/components/admin/Sidebar'; // Use the new AdminSidebar
import { useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
// Removed Link from next/link as it's not directly used here but in AdminSidebar

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Determine header title based on pathname for mobile
  const getHeaderTitle = () => {
    const currentNavItem = adminNavigationItems.find((item) => item.href === pathname);
    return currentNavItem ? currentNavItem.name : 'Admin Dashboard';
  };
  // This is a workaround since adminNavigationItems is in AdminSidebar.tsx
  // Ideally, this array could be shared or logic improved.
  // For simplicity, just hardcoding titles or using a generic one.
  const getDynamicHeaderTitle = () => {
    if (pathname === '/admin') return 'Overview';
    if (pathname === '/admin/upload') return 'Upload Donors';
    if (pathname === '/admin/feedback') return 'View Feedback';
    if (pathname === '/admin/submitted-lists') return 'Submitted Lists';
    return 'Admin Dashboard';
  };

  useEffect(() => {
    if (status === 'loading') return; // Don't redirect until session is loaded

    if (status === 'unauthenticated') {
      redirect(`/login?callbackUrl=${pathname}`);
    } else if (session?.user?.role !== 'ADMIN') {
      console.warn('Access Denied: User is not an ADMIN. Redirecting.');
      redirect('/'); // Redirect non-admins to the homepage
    }
  }, [status, session, pathname]); // Added session and pathname to dependencies

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
    // Show loading or a brief message before redirect for non-admins
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-indigo-600 animate-pulse">Verifying access...</p>
      </div>
    );
  }
  // If unauthenticated, redirect will handle it.

  return (
    <div className="flex overflow-hidden min-h-screen bg-gray-100">
      {' '}
      {/* Parent flex container */}
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      {/* Main content area. MUST have margin-left on desktop to make space for the sidebar */}
      <div className="flex flex-col md:block  md:ml-2 w-full">
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
        <main className="overflow-y-hidden p-4 md:p-6 lg:p-8">{children}</main>
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
