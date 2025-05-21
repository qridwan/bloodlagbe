// src/components/DonorProfileForm.tsx
'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import SelectInput from './atoms/SelectInput';

// Re-use or import these types. For now, defined here for clarity.
type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

interface Campus {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

export interface DonorProfileFormData {
  id?: string;
  name: string;
  bloodGroup: BloodGroup | '';
  contactNumber: string;
  email?: string;
  district: string;
  city: string;
  campusId: string | '';
  groupId: string | '';
  isAvailable: boolean;
  tagline?: string;
}

interface FilterOptions {
  campuses: Campus[];
  groups: Group[];
  bloodGroups: { id: BloodGroup; name: string }[];
}

interface DonorProfileFormProps {
  initialData: DonorProfileFormData | null; // Null if data is still loading in parent
  filterOptions: FilterOptions | null; // Null if options are still loading
  onSubmit: (formData: DonorProfileFormData) => Promise<void>;
  isSaving?: boolean;
  mode: 'create' | 'edit';
}

const defaultFormData: DonorProfileFormData = {
  name: '',
  bloodGroup: '',
  contactNumber: '',
  email: '',
  district: '',
  city: '',
  campusId: '',
  groupId: '',
  isAvailable: true,
  tagline: '',
};

export default function DonorProfileForm({
  initialData,
  filterOptions,
  onSubmit,
  isSaving,
  mode,
}: DonorProfileFormProps) {
  const [formData, setFormData] = useState<DonorProfileFormData>(defaultFormData);

  // Effect to update form data when initialData prop changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // If initialData becomes null (e.g. user logs out while on page, or error), reset form
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    // Handle checkbox separately for boolean conversion
    if (type === 'checkbox') {
      const checked = (event.target as HTMLInputElement).checked;
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Basic validation example (can be expanded with libraries like Zod or Yup)
    if (
      !formData.name ||
      !formData.bloodGroup ||
      !formData.contactNumber ||
      !formData.district ||
      !formData.city
    ) {
      alert(
        'Please fill in all required fields: Name, Blood Group, Contact, District, City, Campus, and Group.'
      );
      return;
    }
    await onSubmit(formData);
  };

  if (!filterOptions) {
    return <p className="text-sm text-gray-500">Loading form options...</p>;
  }
  if (!initialData && mode === 'edit') {
    // Should ideally not happen if parent manages loading state correctly
    return <p className="text-sm text-gray-500">Loading profile data...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSaving}
          />
        </div>
        {/* Blood Group */}
        <SelectInput
          id="bloodGroup"
          name="bloodGroup"
          label={
            <>
              Blood Group <span className="text-red-500">*</span>
            </>
          }
          optionalLabel=""
          value={formData?.bloodGroup ?? ''}
          onChange={handleChange}
          options={filterOptions.bloodGroups.map((bg) => ({
            value: bg.id,
            label: bg.name,
          }))}
          disabled={isSaving}
        />

        {/* Contact Number */}
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number (Own/Guardian)<span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="contactNumber"
            id="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSaving}
          />
        </div>

        {/* Email (Optional) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email{' '}
            <span className="text-xs text-grey-500 p-[1px] rounded-md">
              (optional, for donation specific communication)
            </span>
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* District */}
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">
            District <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="district"
            id="district"
            value={formData.district}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSaving}
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            id="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSaving}
          />
        </div>

        {/* Tag / Description */}
        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-gray-700">
            Tag{' '}
            <span className="text-xs text-grey-500 p-[1px] rounded-md">
              (optional, add short identity of yourself)
            </span>
          </label>
          <input
            type="text"
            name="tagline"
            id="tagline"
            value={formData.tagline}
            onChange={handleChange}
            placeholder="e.g: 10th batch / CSE20"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campus */}
        <SelectInput
          id="campusId"
          name="campusId"
          label="Campus / Institution"
          optionalLabel="optional"
          value={formData?.campusId ?? ''}
          onChange={handleChange}
          options={filterOptions.campuses.map((campus) => ({
            value: campus.id,
            label: campus.name,
          }))}
          disabled={isSaving}
        />

        {/* Group */}
        <SelectInput
          id="groupId"
          name="groupId"
          label="Social Group / Organization"
          optionalLabel="optional"
          value={formData?.groupId ?? ''}
          onChange={handleChange}
          options={filterOptions.groups.map((group) => ({
            value: group.id,
            label: group.name,
          }))}
          disabled={isSaving}
        />
      </div>

      {/* Is Available (Checkbox, but controlled by AvailabilityToggle primarily) */}
      {/* This field is part of DonorProfileFormData and will be sent,
          but its primary update mechanism will be the separate toggle.
          You could show it as read-only here or allow changing it as part of the main form save.
          For now, let's include it as a checkbox for completeness of the form data.
      */}
      <div className="flex items-center">
        <input
          id="isAvailable"
          name="isAvailable"
          type="checkbox"
          checked={formData.isAvailable}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          disabled={isSaving}
        />
        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
          Currently available for donation
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Profile' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}
