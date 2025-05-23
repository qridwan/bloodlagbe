// src/app/privacy/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - BloodLagbe',
  description:
    'Read the Privacy Policy for BloodLagbe to understand how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl shadow-md border bg-slate-100 mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 text-justify">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 sm:text-5xl">Privacy Policy</h1>
        <small className="mt-4 text-lg text-gray-600">Last Updated: May 21, 2025</small>
      </header>

      <div className="prose prose-lg sm:prose-xl mx-auto text-gray-700">
        {/* <small className="font-semibold text-red-700">
          IMPORTANT: This is a sample Privacy Policy. You MUST consult a legal professional
          to draft a policy compliant with data protection laws in Bangladesh (like the Data Protection Act, if applicable, or general best practices)
          and specific to BloodLagbe&apos;s data handling practices.
        </small> */}

        <h2>1. Introduction</h2>
        <small>
          BloodLagbe (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting
          your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you use our platform.
        </small>

        <h2>2. Information We Collect</h2>
        <small>
          We may collect information about you in a variety of ways. The information we may collect
          includes:
        </small>
        <small>
          <ul>
            <li>
              <strong>Personal Data:</strong> Personally identifiable information, such as your
              name, email address, phone number, location (district, city), blood group,
              campus/group affiliation, and availability status, that you voluntarily give to us
              when you register as a donor or use certain features.
            </li>
            <li>
              <strong>Submitted Content:</strong> Information you provide when you submit donor
              lists (including data within those lists, institute details, contact person
              information) or when you submit feedback (messages, ratings).
            </li>
            <li>
              <strong>Derivative Data:</strong> Information our servers automatically collect when
              you access the Platform, such as your IP address, browser type, operating system,
              access times, and the pages you have viewed directly before and after accessing the
              Platform.
            </li>
            <li>
              <strong>Cookies:</strong> We may use cookies and similar tracking technologies to
              track activity on our Service and hold certain information.
            </li>
          </ul>
        </small>

        <h2>3. How We Use Your Information</h2>
        <small>
          Having accurate information about you permits us to provide you with a smooth, efficient,
          and customized experience. Specifically, we may use information collected about you to:
        </small>
        <small>
          <ul>
            <li>Create and manage your account and donor profile.</li>
            <li>Facilitate connections between blood donors and those seeking blood.</li>
            <li>
              Display your donor profile (including contact details as per your consent) to users
              searching for blood.
            </li>
            <li>Process your submitted donor lists for review by administrators.</li>
            <li>Respond to your feedback and inquiries.</li>
            <li>
              Monitor and analyze usage and trends to improve your experience with the Platform.
            </li>
            <li>Notify you of updates to the Platform.</li>
            {/* Add other uses specific to your platform */}
          </ul>
        </small>

        <h2>4. Disclosure of Your Information</h2>
        <small>We may share information we have collected about you in certain situations:</small>
        <small>
          <ul>
            <li>
              <strong>Publicly Visible Donor Information:</strong> As a core function of the
              platform, certain information from a donor&apos;s profile (e.g., name, blood group,
              contact number, location, availability) is made publicly visible to users searching
              for donors.
            </li>
            <li>
              <strong>With Your Consent:</strong> We may share your information with third parties
              when you explicitly consent.
            </li>
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the release of information
              about you is necessary to respond to legal process, to investigate or remedy potential
              violations of our policies, or to protect the rights, property, and safety of others,
              we may share your information as permitted or required by any applicable law in
              Bangladesh.
            </li>
            <li>
              <strong>Service Providers:</strong> We may share your information with third-party
              vendors, service providers, contractors, or agents who perform services for us or on
              our behalf (e.g., hosting, data analytics - specify if any).
            </li>
            {/* Detail other sharing practices */}
          </ul>
        </small>

        <h2>5. Security of Your Information</h2>
        <small>
          We use administrative, technical, and physical security measures to help protect your
          personal information. While we have taken reasonable steps to secure the personal
          information you provide to us, please be aware that despite our efforts, no security
          measures are perfect or impenetrable, and no method of data transmission can be guaranteed
          against any interception or other type of misuse.
        </small>

        <h2>6. Your Data Rights</h2>
        <small>
          Depending on your location and applicable laws, you may have certain rights regarding your
          personal information, such as:
        </small>
        <small>
          <ul>
            <li>
              The right to access, correct, or update your personal information (you can do this via
              your profile page).
            </li>
            <li>
              The right to request deletion of your personal information (subject to legal and
              operational retention needs).
            </li>
            <li>The right to object to or restrict processing of your data.</li>
            {/* Consult legal advice for full list of rights under Bangladeshi law */}
          </ul>
        </small>
        <small>
          To exercise these rights, please{' '}
          <Link className="text-blue-600 underline" href={'/feedback'} target="_blank">
            contact us
          </Link>
          .
        </small>

        <h2>7. Children&apos;s Privacy</h2>
        <small>
          Our service does not address anyone under the age of 18 (&quot;Children&quot;) without
          parental consent for specific situations if applicable by law. We do not knowingly collect
          personally identifiable information from children under 18. If you are a parent or
          guardian and you are aware that your child has provided us with Personal Information,
          please{' '}
          <Link className="text-blue-600 underline" href={'/feedback'} target="_blank">
            contact us
          </Link>
          .
        </small>

        <h2>8. Changes to This Privacy Policy</h2>
        <small>
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot;
          date.
        </small>

        <h2>9. Contact Us</h2>
        <small>
          If you have questions or comments about this Privacy Policy, please{' '}
          <Link className="text-blue-600 underline" href={'/feedback'} target="_blank">
            contact us
          </Link>
          .
        </small>
      </div>
    </div>
  );
}
