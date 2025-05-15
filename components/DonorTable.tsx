// src/components/DonorTable.tsx

// Re-define types here or import from a shared types file.
// For simplicity, re-defining.
type BloodGroup =
	| 'A_POSITIVE' | 'A_NEGATIVE'
	| 'B_POSITIVE' | 'B_NEGATIVE'
	| 'AB_POSITIVE' | 'AB_NEGATIVE'
	| 'O_POSITIVE' | 'O_NEGATIVE';

interface Campus {
	id: string;
	name: string;
}

interface Group {
	id: string;
	name: string;
}

interface Donor {
	id: string;
	name: string;
	bloodGroup: BloodGroup;
	contactNumber: string;
	email?: string | null;
	district: string;
	city: string;
	isAvailable: boolean;
	campus: Campus;
	group: Group;
	updatedAt: string; // Or Date
}

interface DonorTableProps {
	donors: Donor[];
}

// Helper function to format blood group for display
const formatBloodGroup = (bloodGroup: BloodGroup): string => {
	return bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
};

export default function DonorTable({ donors }: DonorTableProps) {
	if (!donors || donors.length === 0) {
		// This case is usually handled by the parent component,
		// but it's good practice for a component to handle empty data.
		return <p className="text-center text-gray-500 py-4">No donor data to display.</p>;
	}

	return (
		<div className="overflow-x-auto shadow-md rounded-lg">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-100">
					<tr>
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							Name
						</th>
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							Blood Group
						</th>
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							Contact
						</th>
						{/* <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              Email
            </th> */}
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							District
						</th>
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							City
						</th>
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							Campus
						</th>
						<th
							scope="col"
							className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							Group
						</th>
						<th
							scope="col"
							className="hidden md:block px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
						>
							Availability
						</th>
						{/* Optional: Last Updated
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              Last Updated
            </th>
            */}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{donors.map((donor) => (
						<tr key={donor.id} className="hover:bg-gray-50">
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{donor.name}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{formatBloodGroup(donor.bloodGroup)}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{donor.isAvailable ? (
									<a
										href={`tel:${donor.contactNumber}`}
										className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 hover:text-blue-900 transition-colors duration-150"
										title="Call donor"
									>
										<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 14a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2zm14-14a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2h2zm0 14a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2z" />
										</svg>
										{donor.contactNumber}
									</a>
								) : (
									<span className="text-gray-400">{donor.contactNumber}</span>
								)}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{donor.district}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{donor.city}
							</td>
							<td className="px-6 py-4 whitespace-wrap text-sm text-gray-700 min-w-30">
								{donor.campus.name}
							</td>
							<td className="px-6 py-4 whitespace-wrap text-sm text-gray-700 min-w-30">
								{donor.group.name}
							</td>
							<td className="hidden md:block px-6 py-4 whitespace-nowrap text-sm">
								{donor.isAvailable ? (
									<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
										Available
									</span>
								) : (
									<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
										Unavailable
									</span>
								)}
							</td>
							{/* Optional: Last Updated
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(donor.updatedAt).toLocaleDateString()}
              </td>
              */}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}