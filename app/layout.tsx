import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://wa.skwebtech.in'),
  title: {
    default: 'SK WEBTECH — WhatsApp Business Platform',
    template: '%s | SK WEBTECH',
  },
  description: 'SK WEBTECH ka WhatsApp Business Platform — bulk campaigns bhejo, leads manage karo, chatbot automate karo aur real-time analytics dekho. India ka #1 WhatsApp SaaS tool.',
  keywords: [
    'WhatsApp Business Platform',
    'WhatsApp Bulk Campaign',
    'WhatsApp Marketing Tool',
    'SK WEBTECH',
    'WhatsApp CRM',
    'WhatsApp Chatbot',
    'WhatsApp API',
    'WhatsApp SaaS India',
    'Bulk WhatsApp Sender',
    'WhatsApp Business API India',
    'WhatsApp Lead Management',
    'WhatsApp Automation',
  ],
  authors: [{ name: 'SK WEBTECH', url: 'https://wa.skwebtech.in' }],
  creator: 'SK WEBTECH',
  publisher: 'SK WEBTECH',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://wa.skwebtech.in',
    siteName: 'SK WEBTECH',
    title: 'SK WEBTECH — WhatsApp Business Platform',
    description: 'Bulk campaigns bhejo, leads manage karo, chatbot automate karo. India ka #1 WhatsApp Business SaaS Platform.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'SK WEBTECH — WhatsApp Business Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SK WEBTECH — WhatsApp Business Platform',
    description: 'Bulk campaigns, chatbot, CRM aur analytics — sab ek jagah. India ka #1 WhatsApp SaaS Platform.',
    images: ['/logo.png'],
    creator: '@skwebtech',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
