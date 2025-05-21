// src/components/DonorFilters.tsx
'use client';

import React, { useRef } from 'react';
import SelectInput from './atoms/SelectInput';

// Re-define types here or import from a shared types file if you have one
// For simplicity, re-defining for now.
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

interface FilterOptions {
  campuses: Campus[];
  groups: Group[];
  bloodGroups: { id: BloodGroup; name: string }[];
}

interface ActiveFilters {
  bloodGroup?: BloodGroup | '';
  campusId?: string | '';
  groupId?: string | '';
  city?: string | '';
  district?: string | '';
  availability?: 'true' | 'false' | '';
  name?: string | '';
}

interface DonorFiltersProps {
  options: FilterOptions | null;
  activeFilters: ActiveFilters;
  onFilterChange: (newFilter: Partial<ActiveFilters>) => void;
  isLoading?: boolean; // To disable inputs while parent is loading data
}

export default function DonorFilters({
  options,
  activeFilters,
  onFilterChange,
  isLoading,
}: DonorFiltersProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [district, setDistrict] = React.useState<string>(activeFilters?.district || '');
  const [city, setCity] = React.useState<string>(activeFilters?.city || '');
  const [name, setName] = React.useState<string>(activeFilters?.name || '');

  if (!options) {
    return <p className="text-sm text-gray-500">Loading filter options...</p>;
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === 'district') {
      setDistrict(value);
    } else if (name === 'city') {
      setCity(value);
    } else if (name === 'name') {
      setName(value);
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onFilterChange({ [name]: value });
    }, 800); // 800ms debounce
  };

  const clearFilters = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onFilterChange({
      bloodGroup: '',
      campusId: '',
      groupId: '',
      city: '',
      district: '',
      availability: '',
      name: '',
    });
    setDistrict('');
    setCity('');
    setName('');
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
      {/* Blood Group Filter */}
      {/* <div>
				<label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
					Blood Group
				</label>
				<select
					id="bloodGroup"
					name="bloodGroup"
					value={activeFilters.bloodGroup || ''}
					onChange={handleInputChange}
					disabled={isLoading}
					className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
				>
					<option value="">All Blood Groups</option>
					{options.bloodGroups.map((bg) => (
						<option key={bg.id} value={bg.id}>
							{bg.name}
						</option>
					))}
				</select>
			</div> */}
      <SelectInput
        id="bloodGroup"
        name="bloodGroup"
        label="Filter by Blood Group"
        optionalLabel=""
        value={activeFilters?.bloodGroup ?? ''}
        onChange={handleInputChange}
        options={options.bloodGroups.map((bg) => ({
          value: bg.id,
          label: bg.name,
        }))}
        disabled={isLoading}
      />

      {/* Campus Filter */}
      <SelectInput
        id="campusId"
        name="campusId"
        label="Filter by Campus / Institution"
        value={activeFilters?.campusId ?? ''}
        onChange={handleInputChange}
        options={options.campuses.map((campus) => ({
          value: campus.id,
          label: campus.name,
        }))}
        disabled={isLoading}
      />

      {/* Group Filter */}
      <SelectInput
        id="groupId"
        name="groupId"
        label="Filter by Group / Organization"
        value={activeFilters?.groupId ?? ''}
        onChange={handleInputChange}
        options={options.groups.map((group) => ({
          value: group.id,
          label: group.name,
        }))}
        disabled={isLoading}
      />

      {/* Availability Filter */}
      <SelectInput
        id="availability"
        name="availability"
        label="Filter by Availability"
        value={activeFilters?.availability ?? ''}
        onChange={handleInputChange}
        options={[
          { label: 'Available', value: 'true' },
          { label: 'Unavailable', value: 'false' },
        ]}
        disabled={isLoading}
      />

      {/* District Filter */}
      <div>
        <label htmlFor="district" className="block text-sm font-medium text-gray-700">
          District
        </label>
        <input
          type="text"
          id="district"
          name="district"
          value={district}
          onChange={handleInputChange}
          placeholder="e.g., Dhaka"
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* City Filter */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={city}
          onChange={handleInputChange}
          placeholder="e.g., Gulshan"
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      {/* Name Filter */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={handleInputChange}
          placeholder="e.g., Ridwan"
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* You could add a "Clear Filters" button here */}
      <button
        onClick={clearFilters}
        disabled={isLoading}
        className="mt-1 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-0"
      >
        Clear Filters
      </button>
    </div>
  );
}
