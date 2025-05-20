// src/components/DonationHistoryGraph.tsx
'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend, // Optional for Scatter, but can be used
  ResponsiveContainer,
  Label, // For axis labels
} from 'recharts';

// This interface defines the structure of each data point for the graph
export interface DonationTimelineEvent {
  date: number; // Timestamp for X-axis (milliseconds since epoch)
  donationNumber: number; // 1st, 2nd, 3rd donation for Y-axis
  originalDate: string; // Formatted date string for tooltip (e.g., "May 16, 2025")
  location?: string | null; // Optional location for tooltip
}

interface DonationHistoryGraphProps {
  data: DonationTimelineEvent[];
}

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: any) => {
  // 'any' type used for simplicity with Recharts payload
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload; // The actual data object for the point
    return (
      <div className="p-2 bg-white border border-gray-300 rounded shadow-lg text-sm">
        <p className="font-semibold text-gray-700">Date: {dataPoint.originalDate}</p>
        <p className="text-gray-600">Donation No: {dataPoint.donationNumber}</p>
        {dataPoint.location && dataPoint.location !== 'N/A' && (
          <p className="text-gray-600">Location: {dataPoint.location}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function DonationHistoryGraph({ data }: DonationHistoryGraphProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">No donation data to display graph.</p>;
  }

  // Find min and max dates for domain if not automatically handled well by Recharts
  // This helps in setting a reasonable domain for the X-axis.
  const dateValues = data.map((d) => d.date);
  const minDate = Math.min(...dateValues);
  const maxDate = Math.max(...dateValues);

  // Add a little padding to the domain, e.g., 1 month before and after, if data is present
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  const xDomain: [number, number] =
    data.length > 0
      ? [minDate - oneMonthMs, maxDate + oneMonthMs]
      : [new Date().getTime() - oneMonthMs, new Date().getTime() + oneMonthMs]; // Default if no data

  return (
    <div style={{ width: '100%', height: 350 }}>
      {' '}
      {/* Increased height slightly for better axis label visibility */}
      <ResponsiveContainer>
        <ScatterChart
          margin={{
            top: 20,
            right: 30, // Increased right margin for potentially longer date labels
            left: 20, // Increased left margin for Y-axis label
            bottom: 40, // Increased bottom margin for X-axis labels
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            type="number" // X-axis is numeric (timestamps)
            dataKey="date"
            domain={xDomain} // Use calculated domain
            scale="time" // Tell Recharts this number is a time scale
            tickFormatter={(unixTime) =>
              new Date(unixTime).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            }
            stroke="#555"
            tick={{ fontSize: 10 }} // Smaller font for date ticks
            angle={-35} // Angle for readability
            textAnchor="end"
          >
            <Label
              value="Date of Donation"
              offset={-40}
              position="insideBottom"
              fill="#555"
              fontSize={12}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="donationNumber"
            allowDecimals={false} // Donation number is an integer
            stroke="#555"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 1', 'dataMax + 1']} // Add some padding to Y-axis
          >
            <Label
              value="Donation Count"
              angle={-90}
              position="insideLeft"
              fill="#555"
              fontSize={12}
              style={{ textAnchor: 'middle' }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          {/* Legend is optional, can be removed if only one data series */}
          <Legend align="center" verticalAlign="top" />
          <Scatter name="Donations" data={data} fill="#ef4444" shape="circle" r={6} />{' '}
          {/* r is radius of points */}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
