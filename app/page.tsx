import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'SK WEBTECH — WhatsApp Business Platform | Bulk Campaigns & CRM',
  description: 'SK WEBTECH ke saath apna WhatsApp Business grow karo. Bulk campaigns bhejo, leads manage karo, chatbot setup karo aur analytics dekho — sab ek platform pe. Free mein start karo.',
  alternates: { canonical: 'https://wa.skwebtech.in' },
  openGraph: {
    title: 'SK WEBTECH — WhatsApp Business Platform',
    description: 'Bulk campaigns, CRM, chatbot aur analytics — India ka #1 WhatsApp SaaS Platform. Free mein start karo.',
    url: 'https://wa.skwebtech.in',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'SK WEBTECH WhatsApp Platform' }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://wa.skwebtech.in/#organization',
      name: 'SK WEBTECH',
      url: 'https://wa.skwebtech.in',
      logo: { '@type': 'ImageObject', url: 'https://wa.skwebtech.in/logo.png' },
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
      '@id': 'https://wa.skwebtech.in/#website',
      url: 'https://wa.skwebtech.in',
      name: 'SK WEBTECH',
      publisher: { '@id': 'https://wa.skwebtech.in/#organization' },
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
      publisher: { '@id': 'https://wa.skwebtech.in/#organization' },
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

export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
