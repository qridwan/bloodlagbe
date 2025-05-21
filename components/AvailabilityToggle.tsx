// src/components/AvailabilityToggle.tsx
'use client';

import { useState, useEffect } from 'react';

interface AvailabilityToggleProps {
  initialIsAvailable: boolean;
  onAvailabilityChange: (newAvailability: boolean) => Promise<void>;
  isSaving?: boolean; // To show loading/disabled state
}

export default function AvailabilityToggle({
  initialIsAvailable,
  onAvailabilityChange,
  isSaving,
}: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);

  // Update internal state if the prop changes (e.g., after successful save from parent)
  useEffect(() => {
    setIsAvailable(initialIsAvailable);
  }, [initialIsAvailable]);

  const handleToggle = async () => {
    const newAvailability = !isAvailable;
    // setIsAvailable(newAvailability); // Optimistic update, or wait for parent
    await onAvailabilityChange(newAvailability);
    // Parent component should update initialIsAvailable prop, which will flow down
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
      <span className="text-lg font-medium text-gray-700">My Donation Availability:</span>
      <button
        onClick={handleToggle}
        disabled={isSaving}
        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${
          isAvailable ? 'bg-green-500' : 'bg-gray-300'
        }`}
        aria-pressed={isAvailable}
      >
        <span className="sr-only">Toggle Availability</span>
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
            isAvailable ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className={`text-lg font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
        {isSaving ? 'Updating...' : isAvailable ? 'Available' : 'Unavailable'}
      </span>
    </div>
  );
}
