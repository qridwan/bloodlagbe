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
	tagline?: string | null;
}

interface DonorTableProps {
	donors: Donor[];
}

// Helper function to format blood group for display
const formatBloodGroup = (bloodGroup: BloodGroup): string => {
	return bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
};
const bloodGroupColor = (bloodGroup: BloodGroup) => {
	switch (bloodGroup) {
		case 'A_POSITIVE':
		case 'A_NEGATIVE':
			return 'bg-pink-100 text-pink-700 border-pink-200';
		case 'B_POSITIVE':
		case 'B_NEGATIVE':
			return 'bg-blue-100 text-blue-700 border-blue-200';
		case 'AB_POSITIVE':
		case 'AB_NEGATIVE':
			return 'bg-purple-100 text-purple-700 border-purple-200';
		case 'O_POSITIVE':
		case 'O_NEGATIVE':
			return 'bg-green-100 text-green-700 border-green-200';
		default:
			return 'bg-gray-100 text-gray-700 border-gray-200';
	}
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
							<div>
								Name <span className="text-gray-500 lowercase block text-xs">
									(tag)
								</span>
							</div>
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
						<tr key={donor.id} className={` ${donor.isAvailable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-80 bg-gray-200'}`}>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{donor.name}
								{donor.tagline && (
									<span className="text-gray-500 block text-xs">
										({donor.tagline})
									</span>
								)}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm">
								<span className={`inline-block px-2 py-1 rounded-full font-semibold tracking-wide shadow-sm border ${bloodGroupColor(donor.bloodGroup)}`}>
									{formatBloodGroup(donor.bloodGroup)}
								</span>
							</td>
							<td className="px-6 py-4 flex gap-2 flex-wrap text-sm text-gray-700">
								<Telephone {...donor} />
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{donor.district}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
								{donor.city}
							</td>
							<td className="px-6 py-4 whitespace-wrap text-sm text-gray-700 min-w-30">
								{donor?.campus?.name ?? "n/a"}
							</td>
							<td className="px-6 py-4 whitespace-wrap text-sm text-gray-700 min-w-30">
								{donor?.group?.name ?? "n/a"}
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
							{/* Optional: Last Updated */}
							{/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(donor.updatedAt).toLocaleDateString()}
							</td> */}

						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

const Telephone = (donor: Donor) => {
	return (donor.isAvailable && donor.contactNumber ? (
		<>
			{
				donor.contactNumber.split(",").map((number, index) => (
					<a
						key={number + index}
						href={`tel:${number.trim()}`}
						className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 hover:text-blue-900 transition-colors duration-150"
						title="Call donor"
					>
						{
							number !== "n/a" ?
								<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 14a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2zm14-14a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2h2zm0 14a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2z" />
								</svg>
									{number.trim()} </> : number.trim()
						}
					</a>
				))

			}
		</>
	) : (
		<span className="text-gray-400 w-full bg-gray-400">{donor.contactNumber}</span>
	))
}
