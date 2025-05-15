// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // If you need programmatic navigation on signout

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false }); // Set redirect to false if you want to handle it manually
    router.push('/'); // Redirect to homepage after sign out
  };

  return (
    <nav className="bg-gradient-to-r from-red-600 to-rose-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-2xl font-bold hover:text-red-200 transition-colors">
                🩸 BloodLagbe
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-red-100 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/donors"
                className="text-red-100 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Find Donors
              </Link>

              {status === 'authenticated' && (
                <>
                  <Link
                    href="/profile/donor"
                    className="text-red-100 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    My Profile
                  </Link>
                  {session.user?.role === 'ADMIN' && (
                    <Link
                      href="/admin/upload" // Or a general /admin dashboard page
                      className="text-red-100 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Admin Upload
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {status === 'loading' && (
                <p className="text-red-200 text-sm">Loading...</p>
              )}
              {status === 'unauthenticated' && (
                <>
                  <Link
                    href="/login"
                    className="text-red-100 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="ml-2 bg-white text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors shadow"
                  >
                    Register
                  </Link>
                </>
              )}
              {status === 'authenticated' && (
                <div className="ml-3 relative flex items-center">
                  <span className="text-red-100 text-sm mr-3">
                    Hi, {session.user?.name || 'User'}!
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-rose-500 text-white hover:bg-rose-600 px-3 py-2 rounded-md text-sm font-medium transition-colors shadow"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Mobile menu button (can be implemented later if needed) */}
          <div className="-mr-2 flex md:hidden">
            <button type="button" className="bg-red-700 inline-flex items-center justify-center p-2 rounded-md text-red-200 hover:text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900 focus:ring-white">
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu (e.g., hamburger) */}
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu, show/hide based on menu state (can be implemented later) */}
      {/* <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          </div>
        <div className="pt-4 pb-3 border-t border-red-700">
           </div>
      </div> */}
    </nav>
  );
}