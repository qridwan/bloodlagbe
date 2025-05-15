// src/components/SignInForm.tsx
'use client'; // This needs to be a client component

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

export default function SignInForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null); // Clear previous errors
		setIsLoading(true);

		try {
			const result = await signIn('credentials', {
				redirect: false, // Handle redirect manually
				email,
				password,
			});

			setIsLoading(false);

			if (result?.error) {
				// Handle errors returned by next-auth authorize function
				console.error('Sign In Error:', result.error);
				setError('Invalid email or password. Please try again.'); // User-friendly message
			} else if (result?.ok) {
				// Sign-in successful
				// console.log('Sign in successful');
				// Redirect to a dashboard or home page after successful login
				// You might want to redirect based on user role later
				router.push('/dashboard'); // Example redirect path
				// Optionally refresh the page to ensure session state is fully updated everywhere
				router.refresh();
			} else {
				// Handle unexpected cases
				setError('An unexpected error occurred during sign in.');
			}
		} catch (err) {
			setIsLoading(false);
			console.error("Caught Sign In Exception: ", err);
			setError('An error occurred. Please try again later.');
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && <p className="text-red-500 text-sm">{error}</p>}
			<div>
				<label htmlFor="email-signin" className="block text-sm font-medium text-gray-700">
					Email
				</label>
				<input
					id="email-signin"
					name="email"
					type="email"
					autoComplete="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					disabled={isLoading}
				/>
			</div>

			<div>
				<label htmlFor="password-signin" className="block text-sm font-medium text-gray-700">
					Password
				</label>
				<input
					id="password-signin"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					disabled={isLoading}
				/>
			</div>

			<div>
				<button
					type="submit"
					disabled={isLoading}
					className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
						}`}
				>
					{isLoading ? 'Signing In...' : 'Sign In'}
				</button>
			</div>
		</form>
	);
}