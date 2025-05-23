'use client';

import { FolderPlus, MenuSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ProfileSidebarOverlay from './ProfileSidebarOverlay';

const navigationItems = [
  { name: 'My Details', href: '/profile/donor', icon: '👤' },
  { name: 'Edit Profile', href: '/profile/edit', icon: '📝' },
  { name: 'Add Donation Record', href: '/profile/donation/add', icon: '➕' },
  { name: 'Donation Activity', href: '/profile/donations', icon: '📊' },
  { name: 'Contribute', href: '/profile/submitList', icon: <FolderPlus size={16} /> },
  { name: 'My Submitted Lists', href: '/profile/myContribution', icon: '📂' },
];

export default function ProfileNavBar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-16 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-slate-100 shadow-md flex items-center justify-between px-4 md:px-8 py-3 backdrop-blur-sm">
        <h2 className="text-lg font-semibold">User Dashboard</h2>
        <div className="flex-1 hidden md:flex justify-center gap-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap
                  transition-all duration-150
                  ${
                    isActive
                      ? 'bg-rose-600 text-white shadow scale-105'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        <button
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <MenuSquare size={24} />
        </button>
      </nav>

      <ProfileSidebarOverlay
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={navigationItems}
      />
    </>
  );
}
