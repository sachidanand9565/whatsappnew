'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, Mail, MessageCircle, Clock, HelpCircle, Zap, Shield, Users, ChevronDown, Search } from 'lucide-react';

const faqs = [
  { q: 'How do I connect my WhatsApp Business account?', a: 'Go to Settings in your dashboard and enter your Meta API credentials (Access Token, Phone Number ID, and WABA ID). Follow the Meta Business setup guide to get these credentials.' },
  { q: 'How do I send a bulk campaign?', a: 'Create a message template first (requires Meta approval), then go to Campaigns → New Campaign, select your template and target contacts, and launch.' },
  { q: 'Can I import contacts via CSV?', a: 'Yes. Go to Contacts → Import and upload a CSV file with columns: name, phone, email, city, source. Duplicate numbers are handled automatically.' },
  { q: 'How does the chatbot work?', a: 'The chatbot uses keyword-triggered rules. When an incoming message matches a rule (exact, contains, starts_with, or any), it sends the configured auto-reply.' },
  { q: 'What message types are supported?', a: 'Text, images, documents, videos, audio, templates, interactive messages, reactions, location, and contact cards.' },
  { q: 'How do I add team members?', a: 'Admin users can go to Agents in the sidebar to invite and manage team members with different roles (admin, manager, agent).' },
];

const supportOptions = [
  { icon: Phone,         title: 'Call Us',        value: '+91 6386103750',        desc: 'Mon–Sat, 9 AM – 7 PM IST',  href: 'tel:+916386103750',            iconBg: 'bg-green-50',    iconColor: 'text-green-600',    btnText: 'Call Now',          btnStyle: 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/10' },
  { icon: Mail,          title: 'Email Support',  value: 'sachi274406@gmail.com', desc: 'We reply within 24 hours',   href: 'mailto:sachi274406@gmail.com', iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-600',  btnText: 'Send Email',      btnStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10' },
  { icon: MessageCircle, title: 'WhatsApp Chat',  value: '+91 6386103750',        desc: 'Chat directly on WhatsApp', href: 'https://wa.me/916386103750',   iconBg: 'bg-emerald-50/50', iconColor: 'text-emerald-500', btnText: 'Chat on WhatsApp', btnStyle: 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-green-500/10' },
];

const highlights = [
  { icon: Clock,  title: 'Fast Response',    desc: 'Average response time under 2 hours during business hours.' },
  { icon: Zap,    title: 'Expert Team',      desc: 'Our team knows the platform inside out and resolves issues quickly.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data and queries are handled with full confidentiality.' },
  { icon: Users,  title: 'Dedicated Support',desc: 'Enterprise customers get a dedicated account manager.' },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans antialiased">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <Link href="/" className="transition-transform duration-200 hover:scale-[1.02] flex items-center">
            <Image src="/logo.png" alt="SK WEBTECH" width={160} height={160} priority className="h-16 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-655 hover:text-green-600 transition px-3.5 py-2 rounded-xl hover:bg-slate-100/50">Sign In</Link>
            <Link href="/signup" className="btn-primary text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-36 lg:pt-44 pb-8 px-4 text-center bg-gradient-to-b from-green-50/50 via-white to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.06),transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
            <HelpCircle size={13} className="text-green-600" /> Support Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            How Can We <br className="xs:hidden" />
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Help You?</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Our team is ready to assist you. Reach us by phone, email, or WhatsApp — we&apos;re here to make sure your experience is seamless.
          </p>

          {/* Search Box */}
          <div className="relative max-w-md mx-auto pt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 mt-1.5" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles, guides, FAQs..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 shadow-sm transition-all"
            />
          </div>

          {/* Popular Help Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1 font-medium">
            <span>Popular topics:</span>
            {['Meta Setup', 'Campaigns', 'Chatbots', 'CSV Import'].map((topic) => (
              <button
                key={topic}
                onClick={() => setSearchQuery(topic)}
                className="bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-md transition-colors border border-slate-200/40"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-4 md:py-12 px-4 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {supportOptions.map(({ icon: Icon, title, value, desc, href, iconBg, iconColor, btnText, btnStyle }) => (
            <div key={title} className="glass-card glass-card-hover p-6 flex flex-col items-center text-center border border-slate-200/60 bg-white/70 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4.5 shadow-sm border border-slate-100/50`}>
                <Icon size={26} className={iconColor} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">{title}</h3>
              <p className="text-green-600 font-bold text-sm mb-1.5 break-all font-mono">{value}</p>
              <p className="text-slate-400 text-xs mb-6 font-medium">{desc}</p>
              <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all duration-300 shadow-sm active:translate-y-0.5 ${btnStyle}`}>
                {btnText}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Info Banner */}
      <section className="py-6 md:py-10 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(22,163,74,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">SK WEBTECH Support Team</h3>
            <p className="text-green-100/80 text-xs font-bold tracking-wider mt-1.5 uppercase">INNOVATE &bull; DEVELOP &bull; ELEVATE</p>
          </div>
          <div className="flex flex-wrap md:flex-nowrap justify-center gap-3.5 text-xs w-full md:w-auto relative z-10">
            <a href="tel:+916386103750" className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 px-5 py-3 rounded-xl transition text-white font-bold border border-white/10 shadow-sm whitespace-nowrap">
              <Phone size={14} /> +91 6386103750
            </a>
            <a href="mailto:sachi274406@gmail.com" className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 px-5 py-3 rounded-xl transition text-white font-bold border border-white/10 shadow-sm whitespace-nowrap">
              <Mail size={14} /> sachi274406@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Why Our Support */}
      <section className="py-16 px-4 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-800 tracking-tight">
            Why Choose <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">SK WEBTECH Support</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {highlights.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-5 border border-slate-205/60 bg-white/80 shadow-sm hover:shadow-md transition-all duration-350">
                <div className="w-10 h-10 bg-green-50 border border-green-200/40 rounded-xl flex items-center justify-center mb-4 text-green-650">
                  <Icon size={20} />
                </div>
                <h4 className="text-slate-800 font-bold text-sm mb-1.5">{title}</h4>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto space-y-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-800 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={q} className="glass-card border border-slate-200/60 overflow-hidden transition-all duration-300 hover:border-slate-300 bg-white shadow-sm">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-slate-800 focus:outline-none"
                  >
                    <span className="flex items-start gap-2.5 text-sm sm:text-base leading-snug">
                      <HelpCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                      {q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-green-600' : ''}`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[300px] border-t border-slate-100 bg-slate-50/50' : 'max-h-0'
                    }`}
                  >
                    <p className="text-slate-500 text-sm leading-relaxed px-5 py-4 pl-8 sm:pl-9">{a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-green-50/30">
        <div className="max-w-3xl mx-auto text-center glass-card border border-green-150/40 bg-white/90 rounded-[2.5rem] p-8 sm:p-12 shadow-md relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-green-500/10 rounded-full blur-xl pointer-events-none" />
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2 text-slate-800">Still Have Questions?</h2>
          <p className="text-slate-550 text-sm sm:text-base mb-8">Our support team is just a message away.</p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <a href="mailto:sachi274406@gmail.com" className="btn-primary py-3 px-8 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Mail size={16} /> Email Us
            </a>
            <a href="tel:+916386103750" className="btn-secondary py-3 px-8 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-200">
              <Phone size={16} /> Call +91 6386103750
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200/60 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <Link href="/" className="transition-transform duration-200 hover:scale-[1.03]">
            <Image src="/logo.png" alt="SK WEBTECH" width={160} height={160} className="h-20 w-auto" />
          </Link>
          <div className="flex items-center gap-4.5 text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
            <span>Innovate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Develop</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Elevate</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
            <Link href="/" className="hover:text-green-600 transition">Home</Link>
            <span className="text-slate-200 font-normal">|</span>
            <Link href="/login" className="hover:text-green-600 transition">Sign In</Link>
            <span className="text-slate-200 font-normal">|</span>
            <Link href="/signup" className="hover:text-green-600 transition">Get Started</Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            &copy; {new Date().getFullYear()} SK WEBTECH. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
