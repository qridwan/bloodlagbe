/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/feedback/page.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Corresponds to Prisma enum FeedbackType
const feedbackTypes = [
  { value: 'SUGGESTION', label: 'Suggestion' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'COMPLIMENT', label: 'Compliment' },
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry' },
];

export default function FeedbackPage() {
  const { data: session, status } = useSession();
  const [feedbackType, setFeedbackType] = useState<string>(feedbackTypes[0].value);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | string>(''); // Store as string for select, convert on submit
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload: any = {
      feedbackType,
      message,
      rating: rating ? parseInt(String(rating), 10) : undefined,
    };

    if (status === 'unauthenticated') {
      payload.guestName = guestName;
      payload.guestEmail = guestEmail;
      if (!guestEmail && (feedbackType === 'BUG_REPORT' || feedbackType === 'GENERAL_INQUIRY')) {
        // Optionally require email for certain types from guests for follow-up
        // setSubmitStatus({ type: 'error', message: 'Email is required for this feedback type if you are not logged in.' });
        // setIsSubmitting(false);
        // return;
      }
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit feedback.');
      }

      setSubmitStatus({ type: 'success', message: 'Thank you! Your feedback has been submitted.' });
      setMessage('');
      setRating('');
      setGuestName('');
      setGuestEmail('');
      setFeedbackType(feedbackTypes[0].value);
    } catch (err: any) {
      setSubmitStatus({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Contact Us</h1>
        <p className="text-lg text-gray-600 mt-2">
          We value your opinion! Help us improve <strong>Bloodlagbe</strong> platform.
        </p>
      </header>

      {submitStatus && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            submitStatus.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700">
            Feedback Type <span className="text-red-500">*</span>
          </label>
          <select
            id="feedbackType"
            name="feedbackType"
            value={feedbackType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFeedbackType(e.target.value)}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={isSubmitting}
          >
            {feedbackTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Share your thoughts, suggestions, or report an issue..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
            Overall Rating (Optional)
          </label>
          <select
            id="rating"
            name="rating"
            value={rating}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setRating(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={isSubmitting}
          >
            <option value="">Select rating (1-5)</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}⭐{' '}
              </option>
            ))}
          </select>
        </div>

        {status === 'unauthenticated' && (
          <>
            <p className="text-sm text-gray-600">
              You are submitting as a guest. Providing your name and email is optional but helps us
              follow up if needed.
            </p>
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">
                Your Name (Optional)
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={guestName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700">
                Your Email (Optional)
              </label>
              <input
                type="email"
                id="guestEmail"
                name="guestEmail"
                value={guestEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGuestEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        {status === 'authenticated' && session?.user && (
          <p className="text-sm text-gray-600">
            You are submitting feedback as{' '}
            <span className="font-medium underline">{session.user.name || session.user.email}</span>
            .
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
        >
          {isSubmitting ? 'Submitting...' : 'Send Feedback'}
        </button>
      </form>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
