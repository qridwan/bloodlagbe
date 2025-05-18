/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, FormEvent, ChangeEvent, DragEvent } from 'react';
import { useSession } from 'next-auth/react';
import { UploadCloud, Loader2, CheckCircle2, XCircle } from 'lucide-react';

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
	const [dragActive, setDragActive] = useState(false);

	const handleFile = (selectedFile: File) => {
		setFile(selectedFile);
		setMessage(null);
		setErrorDetails(null);
		setSuccessCount(null);
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFile(e.target.files[0]);
		}
	};

	const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		setDragActive(true);
	};

	const handleDragLeave = () => {
		setDragActive(false);
	};

	const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFile(e.dataTransfer.files[0]);
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
		formData.append('donorFile', file);

		try {
			const response = await fetch('/api/admin/upload-donors', {
				method: 'POST',
				body: formData,
			});

			const result: UploadResponse = await response.json();

			if (!response.ok) {
				setMessage(result.message ?? `Upload failed with status ${response.status}`);
				if (result.errors) setErrorDetails(result.errors);
			} else {
				setMessage(result.message);
				setSuccessCount(result.successCount ?? null);
				if (result.errors?.length) setErrorDetails(result.errors);
			}
		} catch (err: any) {
			console.error('Upload error:', err);
			setMessage(`Unexpected error: ${err.message ?? 'Please try again.'}`);
		} finally {
			setIsLoading(false);
		}
	};

	if (status === 'loading') return <p>Loading session...</p>;

	if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
		return <p className="text-red-500">Access Denied. Admins only.</p>;
	}

	return (
		<div className="p-6 border rounded-xl shadow bg-white max-w-xl mx-auto">
			<h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Donor List (CSV)</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="w-full">
					<label
						htmlFor="donor-file-input"
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`w-full border-2 rounded-lg cursor-pointer text-center transition ${dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-dashed border-gray-300'
							}`}
					>
						<input
							id="donor-file-input"
							type="file"
							accept=".csv"
							onChange={handleFileChange}
							className="hidden"
						/>
						<div className="flex flex-col items-center justify-center px-4 py-6 text-sm text-gray-600">
							<UploadCloud className="w-8 h-8 mb-2 text-indigo-500" />
							<p>
								Drag & drop your CSV file here or{' '}
								<span className="underline text-indigo-600">click to browse</span>
							</p>
							{file && <p className="mt-2 text-green-600 font-medium">Selected: {file.name}</p>}
						</div>
					</label>
				</div>


				<button
					type="submit"
					disabled={isLoading || !file}
					className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition"
				>
					{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
					{isLoading ? 'Uploading...' : 'Upload File'}
				</button>
			</form>

			{message && (
				<div
					className={`mt-4 p-4 rounded-md flex items-center gap-2 text-sm ${errorDetails || message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid')
						? 'bg-red-100 text-red-700'
						: 'bg-green-100 text-green-700'
						}`}
				>
					{errorDetails || message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') ? (
						<XCircle className="w-5 h-5" />
					) : (
						<CheckCircle2 className="w-5 h-5" />
					)}
					<div>
						<p>{message}</p>
						{successCount !== null && <p>Successfully added donors: {successCount}</p>}
					</div>
				</div>
			)}

			{errorDetails && errorDetails.length > 0 && (
				<div className="mt-4">
					<h3 className="text-md font-semibold text-red-700">Error Details ({errorDetails.length} rows):</h3>
					<ul className="list-disc list-inside max-h-60 overflow-y-auto bg-red-50 p-3 rounded text-xs text-red-700">
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
