// src/app/about/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - BloodLagbe',
  description:
    'Learn more about BloodLagbe, our mission to connect blood donors and recipients in Bangladesh, and how you can help save lives.',
};

export default function AboutUsPage() {
  return (
    <div className="max-w-3xl text-justify bg-slate-100 shadow-md border mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-red-700 sm:text-5xl">About BloodLagbe</h1>
        <p className="mt-4 text-xl text-gray-600">Connecting Lifesavers, Inspiring Hope.</p>
      </header>

      <section className="prose prose-lg sm:prose-xl mx-auto text-gray-700">
        <h2>Our Mission</h2>
        <small>
          At BloodLagbe, our mission is to bridge the critical gap between voluntary blood donors
          and individuals in urgent need of blood across Bangladesh. We aim to create a seamless,
          accessible, and reliable platform that empowers communities to save lives through the
          simple act of blood donation.
        </small>

        <h2>What We Do</h2>
        <small>BloodLagbe provides a user-friendly online environment where:</small>
        <small>
          <ul>
            <li>
              Individuals and hospitals can quickly search for available blood donors based on blood
              group, location (district, city), and campus/group affiliations.
            </li>
            <li>
              Voluntary donors can easily register, create a profile, and manage their availability
              status.
            </li>
            <li>
              Users can track their donation history and see the impact of their contributions.
            </li>
            <li>
              Organizations, campuses, and groups can submit their donor lists to be part of our
              wider network, after admin review.
            </li>
          </ul>
        </small>
        <small>
          We believe that technology can play a vital role in streamlining the process of blood
          donation and ensuring that no one suffers due to a lack of timely access to blood.
        </small>

        <h2>Why Blood Donation Matters in Bangladesh</h2>
        <small>
          Access to safe blood is a cornerstone of effective healthcare. In Bangladesh, there is a
          constant demand for blood due to medical emergencies, surgeries, thalassemia patients, and
          other conditions. Voluntary, non-remunerated blood donation is the safest source of blood,
          and platforms like BloodLagbe are crucial in fostering a culture of regular voluntary
          donation.
        </small>
        <small>Every drop counts, and every donor is a hero.</small>

        <h2>Get Involved</h2>
        <small>You can be a part of this life-saving mission:</small>
        <small>
          <ul>
            <li>
              <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">
                Register as a Donor
              </Link>
              : If you are eligible, sign up and become a potential lifesaver.
            </li>
            <li>
              <Link href="/donors" className="text-red-600 hover:text-red-800 font-medium">
                Find a Donor
              </Link>
              : Use our platform if you or someone you know is in need of blood.
            </li>
            <li>
              <Link
                href="/profile/my-list/submit"
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Share a Donor List
              </Link>
              : If your campus or group maintains a donor list, submit it for inclusion.
            </li>
            <li>
              Spread the Word: Encourage your friends, family, and community to learn about the
              importance of blood donation and use BloodLagbe.
            </li>
          </ul>
        </small>
        <small className="mt-6 text-center">
          Together, we can make a difference, one donation at a time.
        </small>
      </section>
    </div>
  );
}
