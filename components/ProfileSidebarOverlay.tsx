'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export default function ProfileSidebarOverlay({ isOpen, onClose, items }: Props) {
  const pathname = usePathname();

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white p-5 shadow-lg transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Navigation</h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white"
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-3">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-150
                  ${
                    isActive
                      ? 'bg-rose-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
