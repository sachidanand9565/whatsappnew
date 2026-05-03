import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | SK WEBTECH',
  description: 'SK WEBTECH WhatsApp Business Platform Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: May 3, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            SK WEBTECH (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the WhatsApp Business Platform at{' '}
            <strong>wa.skwebtech.in</strong>. This Privacy Policy explains how we collect, use, and protect your
            personal information when you use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Account information: name, email address, phone number</li>
            <li>Business information: WhatsApp Business Account (WABA) ID, Phone Number ID</li>
            <li>Message data: campaign messages, contact lists, chat history</li>
            <li>Usage data: login activity, feature usage, analytics</li>
            <li>Facebook/Meta OAuth tokens for WhatsApp Business API access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>To provide and maintain our WhatsApp Business Platform services</li>
            <li>To send WhatsApp messages on your behalf via Meta&apos;s Cloud API</li>
            <li>To manage your contacts, campaigns, and chatbot automations</li>
            <li>To provide customer support and respond to your inquiries</li>
            <li>To improve our platform based on usage analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We share data only with:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mt-3">
            <li><strong>Meta/Facebook</strong> — to send WhatsApp messages via their Cloud API</li>
            <li><strong>Service providers</strong> — hosting and database services necessary to operate the platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Facebook Login & Meta Permissions</h2>
          <p className="text-gray-600 leading-relaxed">
            Our platform uses Facebook Login for Business to connect your WhatsApp Business Account. We request
            only the permissions necessary to manage your WhatsApp Business Account, send messages, and import
            templates. We comply with Meta&apos;s Platform Terms and Developer Policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We use industry-standard security measures including HTTPS encryption, secure database storage, and
            JWT-based authentication to protect your data. Access tokens are stored securely and never exposed
            to unauthorized parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your data for as long as your account is active. Upon account deletion, your personal data
            and message history will be permanently deleted within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Your Rights</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use essential cookies for authentication (JWT tokens) and session management. We do not use
            advertising or tracking cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            For any privacy-related questions or data deletion requests, contact us at:
          </p>
          <div className="mt-3 text-gray-700">
            <p><strong>SK WEBTECH</strong></p>
            <p>Email: <a href="mailto:sachi274406@gmail.com" className="text-blue-600 hover:underline">sachi274406@gmail.com</a></p>
            <p>Website: <a href="https://wa.skwebtech.in" className="text-blue-600 hover:underline">wa.skwebtech.in</a></p>
          </div>
        </section>

        <div className="border-t pt-6 mt-10">
          <p className="text-sm text-gray-400">
            &copy; 2026 SK WEBTECH. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
