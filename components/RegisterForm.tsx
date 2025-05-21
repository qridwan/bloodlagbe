// src/components/RegisterForm.tsx
'use client'; // This needs to be a client component

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Use message from API response if available, otherwise provide default
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Registration successful
      setSuccess('Registration successful! You can now log in.');
      // Optionally redirect to login page after a delay or directly log them in
      setTimeout(() => {
        router.push('/login'); // Redirect to login page
      }, 2000); // Wait 2 seconds
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
      <div>
        <label htmlFor="name-register" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name-register"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="email-register" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email-register"
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
        <label htmlFor="password-register" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password-register"
          name="password"
          type="password"
          autoComplete="new-password" // Important for password managers
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
          disabled={isLoading || !!success} // Disable if loading or successful
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading || success ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}
