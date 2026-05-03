import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SK WEBTECH — WhatsApp Business Platform | Bulk Campaigns & CRM',
  description: 'SK WEBTECH ke saath apna WhatsApp Business grow karo. Bulk campaigns bhejo, leads manage karo, chatbot setup karo aur analytics dekho — sab ek platform pe. Free mein start karo.',
  alternates: { canonical: 'https://skwebteh.com' },
  openGraph: {
    title: 'SK WEBTECH — WhatsApp Business Platform',
    description: 'Bulk campaigns, CRM, chatbot aur analytics — India ka #1 WhatsApp SaaS Platform. Free mein start karo.',
    url: 'https://skwebteh.com',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'SK WEBTECH WhatsApp Platform' }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://skwebteh.com/#organization',
      name: 'SK WEBTECH',
      url: 'https://skwebteh.com',
      logo: { '@type': 'ImageObject', url: 'https://skwebteh.com/logo.png' },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-6386103750',
        contactType: 'customer support',
        email: 'sachi274406@gmail.com',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: ['https://wa.me/916386103750'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://skwebteh.com/#website',
      url: 'https://skwebteh.com',
      name: 'SK WEBTECH',
      publisher: { '@id': 'https://skwebteh.com/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'SK WEBTECH WhatsApp Platform',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: 'Free plan available' },
      featureList: [
        'WhatsApp Bulk Campaigns',
        'CRM Lead Management',
        'Chatbot Automation',
        'Real-time Analytics',
        'Multi-agent Inbox',
        'Template Management',
      ],
      publisher: { '@id': 'https://skwebteh.com/#organization' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is SK WEBTECH?', acceptedAnswer: { '@type': 'Answer', text: 'SK WEBTECH is a WhatsApp Business SaaS platform for sending bulk campaigns, managing leads, automating replies with chatbots, and viewing analytics.' } },
        { '@type': 'Question', name: 'Is SK WEBTECH free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, SK WEBTECH offers a free plan to get started. Premium plans with advanced features are also available.' } },
        { '@type': 'Question', name: 'How do I contact SK WEBTECH support?', acceptedAnswer: { '@type': 'Answer', text: 'You can reach SK WEBTECH support at +91 6386103750 or email sachi274406@gmail.com.' } },
      ],
    },
  ],
};

const features = [
  { icon: '📤', title: 'Bulk Campaigns',  desc: 'Send thousands of WhatsApp messages to your contacts instantly with templates.' },
  { icon: '🤖', title: 'Smart Chatbot',   desc: 'Automate replies 24/7 with keyword-triggered rules and multi-step flows.' },
  { icon: '👥', title: 'CRM Leads',       desc: 'Manage your contacts, track status, assign agents, and import via CSV.' },
  { icon: '📊', title: 'Analytics',       desc: 'Track delivery rates, read rates, and campaign performance in real time.' },
  { icon: '💬', title: 'Live Inbox',      desc: 'Chat with customers in real time through a WhatsApp Web-style interface.' },
  { icon: '⚙️', title: 'Templates',       desc: 'Create and manage approved WhatsApp Business message templates.' },
];

const stats = [
  { value: '10K+', label: 'Messages Sent Daily' },
  { value: '500+', label: 'Businesses Served' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '24/7', label: 'Support Available' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <Image src="/logo.png" alt="SK WEBTECH" width={160} height={160} priority className="h-16 w-auto" />
          <div className="flex items-center gap-3">
            <Link href="/support" className="text-sm text-gray-500 hover:text-green-600 transition hidden sm:block font-medium">
              Support
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-green-600 transition px-4 py-2">
              Sign In
            </Link>
            <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main>
      <section className="pt-28 pb-20 px-4 text-center relative overflow-hidden bg-gradient-to-b from-green-50 to-white" aria-label="Hero">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            WhatsApp Business Platform — Powered by SK WEBTECH
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-gray-900">
            Grow Your Business
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
              With WhatsApp
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Send bulk campaigns, automate replies, manage leads, and track analytics —
            all from one powerful platform built for modern businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-xl transition shadow-lg shadow-green-200 text-base">
              Start Free Today
            </Link>
            <Link href="/login" className="border-2 border-gray-200 hover:border-green-400 text-gray-700 hover:text-green-600 font-bold px-10 py-4 rounded-xl transition text-base bg-white">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-green-600">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
              <div className="text-sm text-green-100">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">
              Everything You Need to{' '}
              <span className="text-green-600">Scale</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A complete WhatsApp business suite — from messaging to analytics, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition group shadow-sm">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-50">
        <div className="max-w-3xl mx-auto text-center bg-white border border-green-100 rounded-3xl p-12 shadow-sm">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">Ready to Get Started?</h2>
          <p className="text-gray-500 mb-8 text-lg">
            Join hundreds of businesses already growing with SK WEBTECH&apos;s platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-xl transition shadow-md">
              Create Free Account
            </Link>
            <Link href="/support" className="border-2 border-gray-200 hover:border-green-400 text-gray-700 font-medium px-10 py-4 rounded-xl transition hover:text-green-600">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <Image src="/logo.png" alt="SK WEBTECH" width={160} height={160} className="h-20 w-auto" />
          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium tracking-widest">
            <span>INNOVATE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span>DEVELOP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span>ELEVATE</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/support" className="hover:text-green-600 transition">Support</Link>
            <span className="text-gray-300">|</span>
            <Link href="/login" className="hover:text-green-600 transition">Sign In</Link>
            <span className="text-gray-300">|</span>
            <Link href="/signup" className="hover:text-green-600 transition">Get Started</Link>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} SK WEBTECH. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
