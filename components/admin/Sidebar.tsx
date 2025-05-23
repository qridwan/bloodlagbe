// src/components/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define your admin navigation items
export const adminNavigationItems = [
  { name: 'Overview', href: '/admin', icon: '🏠' }, // Admin Dashboard Home
  { name: 'Upload Donors', href: '/admin/upload', icon: '📤' },
  { name: 'Manage Campuses', href: '/admin/campuses', icon: '🏫' },
  { name: 'Manage Groups', href: '/admin/groups', icon: '👥' },
  { name: 'Submitted Donor Lists', href: '/admin/submittedLists', icon: '📋' },
  { name: 'View Feedback', href: '/admin/feedback', icon: '💬' },
  // { name: 'Submitted Lists', href: '/admin/submitted-lists', icon: '📋' }, // For future feature
  // Add more admin-specific links here
];

interface AdminSidebarProps {
  isOpen?: boolean;
  toggleSidebar?: () => void;
}

export default function AdminSidebar({ isOpen, toggleSidebar }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 
        w-64 shadow-2xl transform transition-transform duration-300 ease-in-out z-40
        fixed inset-y-0 left-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:sticky md:top-0 md:h-screen md:translate-x-0 
        md:overflow-y-auto
      `}
      aria-label="Admin Sidebar"
    >
      <div className="px-3 mb-6 text-center sticky top-0 bg-gray-700/80 backdrop-blur-sm py-5 z-10">
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
      </div>
      <nav className="space-y-2 px-1 pb-4">
        {adminNavigationItems.map((item) => {
          const isActive =
            pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={isOpen && toggleSidebar ? toggleSidebar : undefined} // Close mobile sidebar on click
              className={`
                 group flex items-center mx-2 px-3 py-3 text-sm font-medium rounded-lg
                transition-all duration-150 ease-in-out
                ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md scale-105'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-sm'
                }
              `}
            >
              <span
                className={`mr-3 text-lg transition-transform duration-150 group-hover:scale-110 ${isActive ? 'transform -rotate-3' : ''}`}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping-slow ml-auto"></span>
              )}
            </Link>
          );
        })}
      </nav>
      {/* You can add other sidebar elements here */}
    </aside>
  );
}
