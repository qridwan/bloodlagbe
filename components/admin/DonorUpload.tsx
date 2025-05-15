// src/components/admin/DonorUpload.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';

interface UploadResponse {
  message: string;
  successCount?: number;
  errorCount?: number;
  errors?: { row: number; message: string; data: any }[];
}

export default function AdminDonorUpload() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<UploadResponse['errors'] | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setMessage(null); // Clear previous messages
      setErrorDetails(null);
      setSuccessCount(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setErrorDetails(null);
    setSuccessCount(null);

    const formData = new FormData();
    formData.append('donorFile', file); // 'donorFile' must match the key expected by the API

    try {
      const response = await fetch('/api/admin/upload-donors', {
        method: 'POST',
        // Headers are not explicitly set for 'Content-Type' when using FormData with fetch;
        // the browser will set it to 'multipart/form-data' with the correct boundary.
        // headers: { 'Content-Type': 'multipart/form-data' }, // Not needed
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (!response.ok) {
        setMessage(`Error: ${result.message || 'Upload failed with status ' + response.status}`);
        if (result.errors) {
          setErrorDetails(result.errors);
        }
      } else {
        setMessage(result.message);
        if (result.successCount !== undefined) {
          setSuccessCount(result.successCount);
        }
        if (result.errors && result.errors.length > 0) {
          setErrorDetails(result.errors);
        }
        // Optionally clear the file input after successful upload
        // (though it might be good to keep it for user reference until they select a new file)
        // setFile(null);
        // (document.getElementById('donor-file-input') as HTMLInputElement).value = ''; // Reset file input
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage(`An unexpected error occurred: ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Only render the form if the user is an admin (though page-level protection is better)
  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
    return <p className="text-red-500">Access Denied. You must be an admin to upload donor lists.</p>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload Donor List (CSV)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="donor-file-input" className="block text-sm font-medium text-gray-700 mb-1">
            Select CSV File
          </label>
          <input
            id="donor-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100
                       disabled:opacity-50"
            disabled={isLoading}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${errorDetails || message.toLowerCase().includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <p>{message}</p>
          {successCount !== null && <p>Successfully added donors: {successCount}</p>}
        </div>
      )}

      {errorDetails && errorDetails.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-red-700">Error Details ({errorDetails.length} rows):</h3>
          <ul className="list-disc list-inside max-h-60 overflow-y-auto bg-red-50 p-2 rounded text-xs text-red-600">
            {errorDetails.map((err, index) => (
              <li key={index}>
                Row {err.row}: {err.message} (Data: <code>{JSON.stringify(err.data)}</code>)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}