import DonorUpload from '@/components/admin/DonorUpload';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed
import Link from 'next/link';

export default async function AdminUploadPage() {
  const session = await getServerSession(authOptions);

  // Protect this page: Only allow admins
  if (!session || session.user?.role !== 'ADMIN') {
    // You can redirect to login or a generic 'unauthorized' page
    // redirect('/login?error=AdminAccessRequired');
    // Or show an unauthorized message on this page
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">
            You do not have permission to view this page. Please log in as an administrator.
          </p>
          <Link
            href="/login"
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Manage donor data uploads.</p>
      </div>
      <DonorUpload />
      {/* You can add links to other admin sections here */}
      <div className="mt-8 text-center">
        <Link href="/admin" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Admin Home (if you create one)
        </Link>
      </div>
    </div>
  );
}
