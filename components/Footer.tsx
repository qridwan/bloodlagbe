// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
        <p className="text-sm">
          &copy; {currentYear} BloodLagbe. All rights reserved.
        </p>
        <p className="text-xs mt-2">
          Connecting donors, saving lives.
          {/* Add other links if needed, e.g., About Us, Contact, Privacy Policy */}
          {/* <Link href="/about" className="ml-2 hover:text-red-600">About</Link> */}
        </p>
      </div>
    </footer>
  );
}