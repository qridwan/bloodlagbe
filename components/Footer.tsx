// src/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto text-slate-600 text-xs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5"> {/* Reduced py-8 to py-5 */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          {/* Left side: Copyright and App Name/Tagline */}
          <div className="text-center sm:text-left">
            <p className="font-medium text-slate-700">
              &copy; {currentYear} BloodLagbe.
              <span className="hidden md:inline"> Connecting donors, saving lives in Bangladesh.</span>
            </p>
            <p className="md:hidden text-slate-500">Connecting donors, saving lives.</p> {/* Shorter for mobile */}
          </div>

          {/* Right side: Links */}
          <nav className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-2" aria-label="Footer navigation">
            <Link href="/about" className="hover:text-red-600 hover:underline">
              About Us
            </Link>
            <Link href="/privacy" className="hover:text-red-600 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-red-600 hover:underline">
              Terms
            </Link>
            <Link href="/feedback" className="hover:text-red-600 hover:underline">
              Feedback
            </Link>
          </nav>
        </div>
        <p className="text-center text-slate-500 mt-4 text-[11px]"> {/* Extra small disclaimer */}
            For informational and connection purposes only. Not a substitute for direct medical advice or screening.
        </p>
      </div>
    </footer>
  );
}
