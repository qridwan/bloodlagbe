// src/app/page.tsx
import Link from 'next/link';
import Image from 'next/image'; // Optional: for an image in the hero section

export default function HomePage() {
  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-20">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-lg shadow-xl">
        <div className="container mx-auto px-6">
          {/* Optional: Logo or relevant image */}
          <Image src="/blood_big.png" alt="Blood Donation" width={60} height={60} className="mx-auto mb-8 rounded-lg" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-red-700 mb-6 leading-tight">
            Be a Lifesaver, <br /> <span className="block md:inline pt-2">Connect Through BloodLagbe.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-10">
            BloodLagbe is a dedicated platform connecting voluntary blood donors with those in urgent need.
            Join our community to find blood or register as a donor and make a difference.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/donors"
              className="px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Find a Donor
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-rose-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            >
              Become a Donor
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works / Features Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-10 md:mb-12">
            Why Choose BloodLagbe?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 text-center">
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <div className="text-red-500 mb-4 inline-block">
                {/* Replace with an actual icon or SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Easy Search & Filter</h3>
              <p className="text-gray-600 text-sm">
                Quickly find donors by blood group, location, campus, and more with our intuitive filters.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <div className="text-red-500 mb-4 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Real-time Availability</h3>
              <p className="text-gray-600 text-sm">
                View up-to-date availability status of donors so you can reach out with confidence.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <div className="text-red-500 mb-4 inline-block">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Manage Your Profile</h3>
              <p className="text-gray-600 text-sm">
                Registered donors can easily update their information and availability status.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 md:py-20 bg-rose-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Whether you need blood or want to donate, BloodLagbe is here to help.
            Join our growing community today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
                href="/register"
                className="px-8 py-3 bg-white text-rose-600 text-lg font-semibold rounded-lg shadow-md hover:bg-rose-50 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rose-600"
            >
                Register as a Donor
            </Link>
            <Link
                href="/donors"
                className="px-8 py-3 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rose-600"
            >
                Search for Donors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}