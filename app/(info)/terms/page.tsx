// src/app/terms/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions - BloodLagbe',
  description: 'Please read the Terms and Conditions for using the BloodLagbe platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl shadow-md border bg-slate-100 mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 text-justify">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 sm:text-5xl">Terms and Conditions</h1>
        <p className="mt-4 text-lg text-gray-600">Last Updated: May 21, 2025</p>
      </header>

      <div className="prose prose-lg sm:prose-xl mx-auto text-gray-700">
        <h2>1. Introduction</h2>
        <small>
          Welcome to BloodLagbe (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your use of our
          website and services. By accessing or using BloodLagbe, you agree to be bound by these
          Terms. If you disagree with any part of the terms, then you may not access the service.
        </small>

        <h2>2. Use of the Platform</h2>
        <small>
          <ul>
            <li>
              You must be at least 18 years old to register as a donor or use certain features of
              this Platform.
            </li>
            <li>
              You agree to provide accurate, current, and complete information during the
              registration process and to update such information to keep it accurate, current, and
              complete.
            </li>
            <li>
              The Platform is intended for facilitating connections between blood donors and those
              in need. Any misuse of the platform for purposes other than its intended use is
              strictly prohibited.
            </li>
          </ul>
        </small>

        <h2>3. Donor Responsibilities</h2>
        <small>
          <ul>
            <li>
              Donors are responsible for ensuring they meet all eligibility criteria for blood
              donation according to local health guidelines in Bangladesh before offering to donate.
            </li>
            <li>
              Donors agree to provide truthful information about their health status, blood group,
              and availability.
            </li>
            <li>
              BloodLagbe is a platform for connection; the actual donation process, medical
              screening, and any associated risks are responsibilities of the donor and the
              recipient/medical facility.
            </li>
          </ul>
        </small>

        <h2>4. Recipient/Seeker Responsibilities</h2>
        <small>
          <ul>
            <li>
              Users seeking blood are responsible for verifying any information provided by donors
              and for arranging the donation process with appropriate medical facilities.
            </li>
            <li>
              BloodLagbe does not verify the health status or eligibility of donors beyond the
              information they provide.
            </li>
          </ul>
        </small>

        <h2>5. User Content and Submissions</h2>
        <small>If you submit donor lists or any other content to the Platform:</small>
        <small>
          <ul>
            <li>You warrant that you have the necessary rights to share this information.</li>
            <li>
              You grant BloodLagbe a license to use, display, and distribute this information for
              the purpose of operating the Platform.
            </li>
            <li>We reserve the right to review, moderate, or remove any submitted content.</li>
          </ul>
        </small>

        <h2>6. Privacy Policy</h2>
        <small>
          Our Privacy Policy, which details how we collect, use, and protect your personal
          information, is an integral part of these Terms. Please review our{' '}
          <Link href="/static/privacy" className="text-red-600 hover:text-red-800">
            Privacy Policy
          </Link>
          .
        </small>

        <h2>7. Disclaimers</h2>
        <small>
          <ul>
            <li>
              BloodLagbe is a facilitation platform. We do not provide medical advice, services, or
              endorse any specific donor or recipient.
            </li>
            <li>We do not guarantee the availability or suitability of any donor.</li>
            <li>
              Information on the platform is largely user-generated. While we encourage accuracy, we
              cannot guarantee it.
            </li>
          </ul>
        </small>

        <h2>8. Limitation of Liability</h2>
        <small>
          To the fullest extent permitted by applicable law (Bangladesh), BloodLagbe shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages, or any
          loss of profits or revenues, whether incurred directly or indirectly, or any loss of data,
          use, goodwill, or other intangible losses, resulting from your access to or use of or
          inability to access or use the service.
        </small>

        <h2>9. Modifications to Terms</h2>
        <small>
          We reserve the right to modify these Terms at any time. We will provide notice of any
          significant changes. Your continued use of the Platform after such modifications will
          constitute your acknowledgment of the modified Terms and agreement to abide and be bound
          by them.
        </small>

        <h2>10. Governing Law</h2>
        <small>
          These Terms shall be governed and construed in accordance with the laws of Bangladesh,
          without regard to its conflict of law provisions.
        </small>

        <h2>11. Contact Us</h2>
        <small>
          If you have any questions about these Terms, please contact us at [Your Contact Email/Link
          to Contact Page].
        </small>
      </div>
    </div>
  );
}
