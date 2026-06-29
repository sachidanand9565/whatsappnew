"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Users,
  BarChart3,
  CheckCircle2,
  Bot,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Sparkles,
  Check,
  DollarSign,
  Menu,
  X,
  HelpCircle,
  Lock,
  MessageCircle,
  ArrowDown,
} from "lucide-react";

// Types for Simulator Messages
interface SimMessage {
  id: string;
  sender: "bot" | "user" | "system" | "agent";
  type: "text" | "template";
  content: string;
  templateImage?: string;
  templateButtons?: string[];
  agentName?: string;
  timestamp: string;
}

export default function HomeClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState<
    "broadcast" | "chatbot" | "recovery" | "support"
  >("broadcast");
  const [simMessages, setSimMessages] = useState<SimMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Dashboard Preview Tab State
  const [activeDashTab, setActiveDashTab] = useState<
    "campaigns" | "inbox" | "flows"
  >("campaigns");

  // Counter simulation state
  const [sentCount, setSentCount] = useState(48290);
  useEffect(() => {
    const interval = setInterval(() => {
      setSentCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // WhatsApp Phone Simulator Messages Sequence
  const useCaseSequences = {
    broadcast: [
      {
        delay: 600,
        action: "typing",
      },
      {
        delay: 1500,
        action: "message",
        message: {
          id: "b1",
          sender: "bot",
          type: "template",
          content: "🎉 Weekend Special Sale! Get flat 30% OFF on our premium collection. Use code WEEKEND30 at checkout.",
          templateImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
          templateButtons: ["Shop Now", "View Catalog"],
          timestamp: "10:02 AM",
        },
      },
      {
        delay: 3500,
        action: "message",
        message: {
          id: "b2",
          sender: "user",
          type: "text",
          content: "👉 Shop Now",
          timestamp: "10:02 AM",
        },
      },
      {
        delay: 4200,
        action: "typing",
      },
      {
        delay: 5500,
        action: "message",
        message: {
          id: "b3",
          sender: "bot",
          type: "text",
          content: "Excellent! Here is your direct discount link: \n🔗 skwebtech.in/shop?code=WEEKEND30\n\nYour cart is ready for checkout. Grab yours before stocks run out! 🛍️",
          timestamp: "10:03 AM",
        },
      },
    ],
    chatbot: [
      {
        delay: 500,
        action: "message",
        message: {
          id: "c1",
          sender: "user",
          type: "text",
          content: "Hi, do you have sneakers in size 9?",
          timestamp: "2:14 PM",
        },
      },
      {
        delay: 1200,
        action: "typing",
      },
      {
        delay: 2200,
        action: "message",
        message: {
          id: "c2",
          sender: "bot",
          type: "text",
          content: "Let me check... 👟\nYes! We have Red AirMax and Black ComfortWalkers in Size 9.\n\nWould you like to book a pair or see pictures?",
          timestamp: "2:14 PM",
        },
      },
      {
        delay: 4000,
        action: "message",
        message: {
          id: "c3",
          sender: "user",
          type: "text",
          content: "Show pictures please",
          timestamp: "2:15 PM",
        },
      },
      {
        delay: 4700,
        action: "typing",
      },
      {
        delay: 6000,
        action: "message",
        message: {
          id: "c4",
          sender: "bot",
          type: "template",
          content: "Here are the Black ComfortWalkers (Size 9). Fits perfectly and comes with a 1-year comfort warranty.",
          templateImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80",
          templateButtons: ["Buy Now - ₹2,499", "View Other Colors"],
          timestamp: "2:15 PM",
        },
      },
    ],
    recovery: [
      {
        delay: 600,
        action: "typing",
      },
      {
        delay: 1600,
        action: "message",
        message: {
          id: "r1",
          sender: "bot",
          type: "template",
          content: "Hey Amit! We noticed you left a few items in your cart. 🛒 We've saved them for you. Complete your order now and get an extra 10% OFF + Free Shipping!",
          templateButtons: ["Complete Checkout", "Edit Cart"],
          timestamp: "4:30 PM",
        },
      },
      {
        delay: 3500,
        action: "message",
        message: {
          id: "r2",
          sender: "user",
          type: "text",
          content: "👉 Complete Checkout",
          timestamp: "4:31 PM",
        },
      },
      {
        delay: 4200,
        action: "typing",
      },
      {
        delay: 5500,
        action: "message",
        message: {
          id: "r3",
          sender: "bot",
          type: "text",
          content: "Awesome! Your discount coupon CART10 is auto-applied.\n\n🔗 Click here to pay: skwebtech.in/pay/c1082\n\nEstimated delivery: 2 days.",
          timestamp: "4:31 PM",
        },
      },
    ],
    support: [
      {
        delay: 500,
        action: "message",
        message: {
          id: "s1",
          sender: "user",
          type: "text",
          content: "I need to change my delivery address for order #48291",
          timestamp: "11:20 AM",
        },
      },
      {
        delay: 1200,
        action: "typing",
      },
      {
        delay: 2200,
        action: "message",
        message: {
          id: "s2",
          sender: "bot",
          type: "text",
          content: "Sure, let me transfer you to our Logistics agent to update this immediately. Hang on for a few seconds...",
          timestamp: "11:20 AM",
        },
      },
      {
        delay: 3200,
        action: "message",
        message: {
          id: "s3",
          sender: "system",
          type: "text",
          content: "🤝 Agent Tanya joined the chat",
          timestamp: "11:21 AM",
        },
      },
      {
        delay: 3800,
        action: "typing",
      },
      {
        delay: 5000,
        action: "message",
        message: {
          id: "s4",
          sender: "agent",
          agentName: "Tanya",
          type: "text",
          content: "Hi! I am Tanya. Please share the new shipping address. I will update it in our system before the parcel leaves our dispatch hub.",
          timestamp: "11:21 AM",
        },
      },
    ],
  };

  // Run conversation simulation based on active usecase
  useEffect(() => {
    setSimMessages([]);
    setIsTyping(false);
    const sequence = useCaseSequences[activeUseCase];
    const timers: NodeJS.Timeout[] = [];

    sequence.forEach((step) => {
      const timer = setTimeout(() => {
        if (step.action === "typing") {
          setIsTyping(true);
        } else if (step.action === "message" && step.message) {
          setIsTyping(false);
          setSimMessages((prev) => [...prev, step.message as SimMessage]);
        }
      }, step.delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [activeUseCase]);

  // Autoscroll chat simulator to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simMessages, isTyping]);

  const faqItems = [
    {
      q: "What is the WhatsApp Business API?",
      a: "The WhatsApp Business API is an official developer tool from Meta that allows medium and large businesses to automate messaging, broadcast bulk campaigns, integrate chatbots, and support multiple customer support agents on a single WhatsApp number.",
    },
    {
      q: "Does SK WEBTECH help in getting the official Green Tick?",
      a: "Yes! We assist businesses in applying for and securing the official Meta Green Verified Tick next to their display name. We guide you through verification prerequisites at no extra cost.",
    },
    {
      q: "Are there any per-message markup costs on SK WEBTECH?",
      a: "No! Unlike many other providers, SK WEBTECH charges ZERO markup fees on your messages. You pay the direct Meta conversation costs directly to Meta, saving you up to 60% on messaging bills.",
    },
    {
      q: "Can we integrate this platform with our existing CRM/website?",
      a: "Absolutely. We offer robust API endpoints, developer documentation, and webhooks that allow you to connect SK WEBTECH with Shopify, WooCommerce, custom CRMs, payment gateways, and databases.",
    },
    {
      q: "How many agents can use the Live Shared Inbox concurrently?",
      a: "Unlimited! You can add as many customer support agents, sales reps, or managers as you need. You can assign, transfer, and monitor chats across your team in real time.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-300/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-green-300/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="SK WEBTECH" width={160} height={160} priority className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">Features</a>
            <a href="#demo" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">Live Demo</a>
            <a href="#dashboard" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">Dashboard</a>
            <a href="#pricing-model" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">Pricing</a>
            <a href="#faqs" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-green-600 transition px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-green-500/10 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-green-600 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-6 py-6 flex flex-col gap-4 shadow-lg animate-slide-up-fade">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-green-600 transition py-2"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-green-600 transition py-2"
            >
              Live Demo
            </a>
            <a
              href="#dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-green-600 transition py-2"
            >
              Dashboard
            </a>
            <a
              href="#pricing-model"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-green-600 transition py-2"
            >
              Pricing
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-green-600 transition py-2"
            >
              FAQ
            </a>
            <hr className="border-slate-100 my-2" />
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center font-bold text-slate-700 hover:text-green-600 transition py-2.5 rounded-xl border border-slate-200"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-3 rounded-xl shadow-md"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white to-slate-50" aria-label="Hero">
        {/* Floating background tags */}
        <div className="absolute top-28 left-[8%] hidden lg:flex items-center gap-2.5 bg-white border border-slate-100/80 shadow-xl shadow-slate-200/40 rounded-full px-4 py-2 animate-float pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">📤 Broadcast Sent</span>
        </div>
        <div className="absolute top-96 left-[3%] hidden lg:flex items-center gap-2.5 bg-white border border-slate-100/80 shadow-xl shadow-slate-200/40 rounded-full px-4 py-2 animate-float-delayed pointer-events-none" style={{ animationDelay: "1.5s" }}>
          <Bot className="w-4 h-4 text-green-500" />
          <span className="text-xs font-bold text-slate-700">🤖 AI Assistant Online</span>
        </div>
        <div className="absolute top-40 right-[6%] hidden lg:flex items-center gap-2.5 bg-white border border-slate-100/80 shadow-xl shadow-slate-200/40 rounded-full px-4 py-2 animate-float-delayed pointer-events-none" style={{ animationDelay: "3s" }}>
          <Sparkles className="text-amber-500 w-4 h-4" />
          <span className="text-xs font-bold text-slate-700">🎉 4.2x Conversions</span>
        </div>
        <div className="absolute top-80 right-[3%] hidden lg:flex items-center gap-2 bg-white border border-slate-100/80 shadow-xl shadow-slate-200/40 rounded-full px-4 py-2 animate-float pointer-events-none" style={{ animationDelay: "0.5s" }}>
          <Users className="w-4 h-4 text-green-500" />
          <span className="text-xs font-bold text-slate-700">👥 12 Support Agents</span>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Animated Header Badge */}
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-green-50 to-green-50 border border-green-100/80 text-green-700 text-xs font-bold px-4 py-2 rounded-full mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Official Meta WhatsApp Business API Partner
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 leading-[1.12] tracking-tight max-w-5xl mx-auto text-slate-900">
            Grow Your Sales & Support on{" "}
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
              WhatsApp
              <svg className="absolute left-0 -bottom-2 w-full h-3.5 text-green-300" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,7 C30,2 70,2 100,7" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            India's most reliable bulk broadcasting, smart CRM, shared inbox, and no-code chatbot builder. Pay zero message markup fees and scale your customer outreach instantly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-extrabold px-9 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/35 hover:-translate-y-1 text-base flex items-center justify-center gap-2"
            >
              Start Free Trial Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto border-2 border-slate-200 hover:border-green-500 hover:bg-green-50/20 text-slate-700 hover:text-green-700 font-extrabold px-9 py-4 rounded-2xl transition-all duration-300 text-base bg-white shadow-sm flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5 text-slate-500 group-hover:text-green-600" /> Watch Live Demo
            </a>
          </div>

          {/* Quick Metrics Banner */}
          <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center relative after:hidden lg:after:block after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-[1px] after:bg-slate-200">
                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                  {sentCount.toLocaleString()}
                </div>
                <div className="text-xs md:text-sm font-semibold text-slate-400 mt-1">Broadcasts Sent Today</div>
              </div>
              <div className="text-center relative after:hidden lg:after:block after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-[1px] after:bg-slate-200">
                <div className="text-3xl md:text-4xl font-extrabold text-slate-800">98.4%</div>
                <div className="text-xs md:text-sm font-semibold text-slate-400 mt-1">Average Open Rate</div>
              </div>
              <div className="text-center relative after:hidden lg:after:block after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-[1px] after:bg-slate-200">
                <div className="text-3xl md:text-4xl font-extrabold text-slate-800">60%</div>
                <div className="text-xs md:text-sm font-semibold text-slate-400 mt-1">Support Cost Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-slate-800">10 Min</div>
                <div className="text-xs md:text-sm font-semibold text-slate-400 mt-1">Setup Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive WhatsApp Live Demo Simulator */}
      <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-100/50 border-y border-slate-200/40 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900 tracking-tight">
              See the WhatsApp Business API in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                Action
              </span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Click the different use cases below to simulate how your messages will look and feel on a customer's WhatsApp screen.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side Selector */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <button
                onClick={() => setActiveUseCase("broadcast")}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  activeUseCase === "broadcast"
                    ? "bg-white border-green-500 shadow-md translate-x-2"
                    : "bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${activeUseCase === "broadcast" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Bulk Promotional Campaigns</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Send updates, catalogs, and holiday offers with interactive action buttons directly to millions.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveUseCase("chatbot")}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  activeUseCase === "chatbot"
                    ? "bg-white border-green-500 shadow-md translate-x-2"
                    : "bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${activeUseCase === "chatbot" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Automated Chatbot FAQ</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Resolve customer product queries 24/7 with keyword-triggered menus, rich media, and direct product templates.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveUseCase("recovery")}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  activeUseCase === "recovery"
                    ? "bg-white border-green-500 shadow-md translate-x-2"
                    : "bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${activeUseCase === "recovery" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Abandoned Cart Recovery</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Automate notifications to users who drop out at checkout. Share a custom discount link to recover sales.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveUseCase("support")}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  activeUseCase === "support"
                    ? "bg-white border-green-500 shadow-md translate-x-2"
                    : "bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${activeUseCase === "support" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Multi-Agent Support Routing</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Seamlessly transition users from automated bots to live customer agents for complex requests.
                  </p>
                </div>
              </button>
            </div>

            {/* Right side Mobile Simulator */}
            <div className="lg:col-span-7 flex justify-center w-full">
              <div className="relative w-full max-w-[340px] h-[580px] sm:h-[670px] bg-slate-950 rounded-[40px] sm:rounded-[50px] shadow-2xl p-2.5 sm:p-3 border-4 border-slate-800 ring-12 ring-slate-900/10">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-3xl z-30 flex items-center justify-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-900 rounded-full" />
                  <div className="w-16 h-1 bg-slate-900 rounded-full" />
                </div>

                {/* Phone screen inside */}
                <div className="relative w-full h-full bg-[#E5DDD5] rounded-[32px] sm:rounded-[42px] overflow-hidden flex flex-col border border-slate-900/50 shadow-inner">
                  {/* WhatsApp Doodle Wallpaper overlay */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: "url('/logo.png')",
                      backgroundSize: "80px",
                      backgroundRepeat: "repeat",
                      mixBlendMode: "overlay",
                    }}
                  />

                  {/* Header */}
                  <div className="relative z-10 bg-green-800 text-white py-3.5 px-4 pt-8 flex items-center gap-2.5 shadow-md">
                    <div className="relative w-9 h-9 rounded-full bg-green-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                      {activeUseCase === "support" && simMessages.some(m => m.sender === "agent") ? "T" : "SK"}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-green-800 rounded-full" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-bold leading-tight">
                        {activeUseCase === "support" && simMessages.some(m => m.sender === "agent") ? "Tanya (SK Support)" : "SK WEBTECH Solutions"}
                      </span>
                      <span className="text-[10px] text-green-200 font-semibold tracking-wider">online</span>
                    </div>
                    {/* Verified Green Tick in Header */}
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400 fill-white" />
                    </div>
                  </div>

                  {/* Message screen */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative z-10 scrollbar-none">
                    {simMessages.map((msg) => {
                      if (msg.sender === "system") {
                        return (
                          <div key={msg.id} className="self-center bg-slate-600/10 backdrop-blur-sm border border-slate-500/10 text-[10px] font-bold text-slate-600 px-3 py-1 rounded-full text-center my-1.5">
                            {msg.content}
                          </div>
                        );
                      }
                      const isMe = msg.sender === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm leading-relaxed flex flex-col relative ${
                            isMe
                              ? "self-end bg-[#DCF8C6] text-slate-800 rounded-tr-none"
                              : "self-start bg-white text-slate-800 rounded-tl-none border border-slate-200/50"
                          }`}
                        >
                          {/* Image template rendering */}
                          {msg.templateImage && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2">
                              <Image
                                src={msg.templateImage}
                                alt="Template banner"
                                fill
                                sizes="400px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Message content */}
                          <span className="whitespace-pre-wrap font-medium">{msg.content}</span>
                          <span className="text-[9px] text-slate-400 self-end mt-1">{msg.timestamp}</span>

                          {/* Quick reply template buttons rendering */}
                          {msg.templateButtons && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5 -mx-1">
                              {msg.templateButtons.map((btn, index) => (
                                <button
                                  key={index}
                                  className="w-full py-1.5 bg-green-50/70 hover:bg-green-50 border border-green-100 text-green-700 font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                >
                                  <MessageSquare className="w-3 h-3" /> {btn}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="self-start bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200/50 flex items-center gap-1.5">
                        <div className="typing-dot w-2 h-2 bg-green-500 rounded-full" />
                        <div className="typing-dot w-2 h-2 bg-green-500 rounded-full" />
                        <div className="typing-dot w-2 h-2 bg-green-500 rounded-full" />
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input bottom bar */}
                  <div className="p-2.5 bg-[#f0f0f0] border-t border-slate-300/40 flex items-center gap-2 relative z-10">
                    <div className="flex-1 bg-white rounded-full px-4 py-2 text-slate-400 text-xs flex items-center justify-between border border-slate-200">
                      <span>Type a message...</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white shadow-md">
                      <Send className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sleek Dashboard Interactive Preview */}
      <section id="dashboard" className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Full Campaign Control
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900 tracking-tight">
              Powerful Dashboard.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                Effortless Operations.
              </span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Manage contacts, analyze click-through rates, and design conversational pathways in an interface built for team velocity.
            </p>
          </div>

          {/* Tab selectors for Dashboard Preview */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
              <button
                onClick={() => setActiveDashTab("campaigns")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeDashTab === "campaigns"
                    ? "bg-white text-green-700 shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Zap className="w-4 h-4" /> Broadcasts
              </button>
              <button
                onClick={() => setActiveDashTab("inbox")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeDashTab === "inbox"
                    ? "bg-white text-green-700 shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="w-4 h-4" /> Shared Inbox
              </button>
              <button
                onClick={() => setActiveDashTab("flows")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeDashTab === "flows"
                    ? "bg-white text-green-700 shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Bot className="w-4 h-4" /> Flow Builder
              </button>
            </div>
          </div>

          {/* Dashboard Panel Outer Glass Frame */}
          <div className="bg-slate-900 rounded-3xl p-3 md:p-4 shadow-2xl border-4 border-slate-800 relative z-10">
            {/* Browser top-bar */}
            <div className="flex items-center gap-2 mb-3.5 px-3">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
              <div className="h-6 bg-slate-800 rounded-md text-[10px] text-slate-500 flex items-center px-4 ml-3 sm:ml-6 w-full max-w-[180px] sm:max-w-xs md:max-w-md font-semibold select-none border border-slate-700/50">
                https://dashboard.skwebtech.in/home
              </div>
            </div>

            {/* Simulated app screen */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800/80 min-h-[440px] text-slate-200 overflow-hidden flex flex-col md:flex-row">
              
              {/* Dashboard Side navigation */}
              <div className="w-full md:w-44 bg-slate-900 p-3 md:p-4 border-b md:border-b-0 md:border-r border-slate-800 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:gap-6">
                <div className="flex items-center gap-2 px-1 flex-shrink-0">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="font-bold text-xs md:text-sm tracking-tight">SK WEBTECH</span>
                </div>
                <div className="flex flex-row md:flex-col gap-1 md:gap-1.5 text-[10px] md:text-xs overflow-x-auto scrollbar-none max-w-full">
                  <span className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg font-bold flex items-center gap-1.5 md:gap-3 cursor-pointer transition flex-shrink-0 ${activeDashTab === "campaigns" ? "bg-green-500/10 text-green-400 border border-green-500/25" : "text-slate-400 hover:bg-slate-800/50"}`} onClick={() => setActiveDashTab("campaigns")}>
                    <Zap className="w-3.5 h-3.5" /> Campaigns
                  </span>
                  <span className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg font-bold flex items-center gap-1.5 md:gap-3 cursor-pointer transition flex-shrink-0 ${activeDashTab === "inbox" ? "bg-green-500/10 text-green-400 border border-green-500/25" : "text-slate-400 hover:bg-slate-800/50"}`} onClick={() => setActiveDashTab("inbox")}>
                    <Users className="w-3.5 h-3.5" /> Live Inbox
                  </span>
                  <span className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg font-bold flex items-center gap-1.5 md:gap-3 cursor-pointer transition flex-shrink-0 ${activeDashTab === "flows" ? "bg-green-500/10 text-green-400 border border-green-500/25" : "text-slate-400 hover:bg-slate-800/50"}`} onClick={() => setActiveDashTab("flows")}>
                    <Bot className="w-3.5 h-3.5" /> Chatbots
                  </span>
                </div>
              </div>

              {/* Dashboard Content area */}
              <div className="flex-1 p-4 sm:p-6 md:p-8 bg-[#0b1329] overflow-x-auto">
                {activeDashTab === "campaigns" && (
                  <div className="animate-slide-up-fade flex flex-col gap-6">
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-black tracking-tight">Campaign Analytics</h3>
                        <p className="text-[10px] sm:text-xs text-slate-400">Detailed logs of your broadcasts and click conversions.</p>
                      </div>
                      <span className="px-3 py-1.5 bg-green-500 text-slate-950 font-bold text-[10px] sm:text-xs rounded-xl shadow-md cursor-pointer hover:bg-green-400 transition-colors flex-shrink-0">
                        + New Campaign
                      </span>
                    </div>

                    {/* Dashboard Mini-cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#121c38] border border-slate-800 p-4 rounded-2xl flex flex-col shadow-sm">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Broadcast Sent</span>
                        <span className="text-xl sm:text-2xl font-black text-white mt-1">148,290</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-green-500 h-full w-[85%] rounded-full" />
                        </div>
                      </div>
                      <div className="bg-[#121c38] border border-slate-800 p-4 rounded-2xl flex flex-col shadow-sm">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Read Rate Avg.</span>
                        <span className="text-xl sm:text-2xl font-black text-green-400 mt-1">84.2%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-green-400 h-full w-[84%] rounded-full" />
                        </div>
                      </div>
                      <div className="bg-[#121c38] border border-slate-800 p-4 rounded-2xl flex flex-col shadow-sm">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">CTR (Link Click)</span>
                        <span className="text-xl sm:text-2xl font-black text-green-400 mt-1">42.8%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-green-400 h-full w-[42%] rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Campaign table simulation */}
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                      <div className="bg-[#121c38] border border-slate-800/80 rounded-2xl overflow-hidden mt-2 min-w-[550px]">
                        <div className="grid grid-cols-4 bg-slate-900/60 p-3 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                          <span>Campaign Display Name</span>
                          <span className="text-center">Sent</span>
                          <span className="text-center">Read %</span>
                          <span className="text-right">Status</span>
                        </div>
                        <div className="flex flex-col text-xs">
                          <div className="grid grid-cols-4 p-4 border-b border-slate-800/40 hover:bg-slate-800/10 transition-colors">
                            <span className="font-bold text-white">🛍️ Flash Sale Promo</span>
                            <span className="text-center text-slate-300 font-semibold">12,500</span>
                            <span className="text-center text-green-400 font-bold">92.4%</span>
                            <span className="text-right font-bold text-green-500">Delivered</span>
                          </div>
                          <div className="grid grid-cols-4 p-4 border-b border-slate-800/40 hover:bg-slate-800/10 transition-colors">
                            <span className="font-bold text-white">🛒 Abandoned Cart Recovery</span>
                            <span className="text-center text-slate-300 font-semibold">4,128</span>
                            <span className="text-center text-green-400 font-bold">86.1%</span>
                            <span className="text-right font-bold text-green-400">Active</span>
                          </div>
                          <div className="grid grid-cols-4 p-4 hover:bg-slate-800/10 transition-colors">
                            <span className="font-bold text-white">📦 Delivery Confirmation</span>
                            <span className="text-center text-slate-300 font-semibold">9,482</span>
                            <span className="text-center text-green-400 font-bold">95.0%</span>
                            <span className="text-right font-bold text-green-500">Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDashTab === "inbox" && (
                  <div className="animate-slide-up-fade grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
                    {/* Inbox left queue */}
                    <div className="md:col-span-4 bg-[#121c38]/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                      <span className="text-xs font-bold text-slate-400">Incoming Chat Queue</span>
                      <div className="flex flex-col gap-2">
                        <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-600 rounded-full text-center flex items-center justify-center font-bold text-[10px] text-white">R</div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-white leading-tight">Rohan Verma</span>
                              <span className="text-[9px] text-green-400 font-medium">Refund Issue</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[8px] font-bold rounded-full">High</span>
                        </div>
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between opacity-80">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-600 rounded-full text-center flex items-center justify-center font-bold text-[10px] text-white">S</div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-white leading-tight">Sarah Jones</span>
                              <span className="text-[9px] text-slate-400 font-medium">Address update</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[8px] font-bold rounded-full">New</span>
                        </div>
                      </div>
                    </div>

                    {/* Inbox Center chat box */}
                    <div className="md:col-span-8 bg-[#121c38] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[320px]">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">Rohan Verma</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] bg-green-500/10 text-green-400 font-bold px-2.5 py-1 rounded-full border border-green-500/10">
                          Assigned to: Agent Priya
                        </span>
                      </div>
                      
                      {/* Mid-chat timeline */}
                      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 text-xs">
                        <div className="self-start bg-slate-900/60 p-2.5 rounded-xl rounded-tl-none max-w-[80%] border border-slate-800">
                          I paid using UPI, amount is deducted but website says payment pending.
                        </div>
                        <div className="self-end bg-green-950/80 p-2.5 rounded-xl rounded-tr-none max-w-[80%] border border-green-900/30 text-right">
                          Hi Rohan! Checking with our finance gateway. Yes, we got the payment. I will manually override the order status to paid.
                        </div>
                      </div>

                      {/* Chat text box input */}
                      <div className="border-t border-slate-800/80 pt-3 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type reply as Agent Priya..."
                          readOnly
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-400 focus:outline-none"
                        />
                        <button className="bg-green-600 hover:bg-green-500 p-2 rounded-xl text-white">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeDashTab === "flows" && (
                  <div className="animate-slide-up-fade flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-black tracking-tight">Visual Chatbot Builder</h3>
                        <p className="text-[10px] sm:text-xs text-slate-400">Define flow paths dynamically based on customer decisions.</p>
                      </div>
                      <span className="px-3 py-1.5 border border-slate-700 bg-slate-900 text-slate-300 font-bold text-[10px] sm:text-xs rounded-xl cursor-pointer flex-shrink-0">
                        + New Node
                      </span>
                    </div>

                    {/* Flow builder Canvas Mock */}
                    <div className="border border-slate-800/80 bg-slate-900/40 rounded-2xl p-6 min-h-[250px] relative flex flex-col md:flex-row items-center justify-around gap-6">
                      
                      {/* Flow Node 1 */}
                      <div className="bg-[#121c38] border border-amber-500/50 p-4.5 rounded-2xl shadow-lg relative w-52 flex flex-col">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Trigger Message</span>
                        <span className="text-xs font-bold text-white">Incoming Message matches "PRICING"</span>
                        <div className="h-0.5 bg-slate-800 my-2.5" />
                        <span className="text-[10px] text-slate-400 font-semibold">Executes: Flow Path 2</span>
                      </div>

                      {/* Connection arrow */}
                      <div className="hidden md:block">
                        <ArrowRight className="w-6 h-6 text-green-500 animate-pulse" />
                      </div>
                      <div className="block md:hidden">
                        <ArrowDown className="w-6 h-6 text-green-500 animate-pulse" />
                      </div>

                      {/* Flow Node 2 */}
                      <div className="bg-[#121c38] border border-green-500/50 p-4.5 rounded-2xl shadow-lg relative w-52 flex flex-col">
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1">Message Action</span>
                        <span className="text-xs font-bold text-white">Send "Choose Package Template"</span>
                        <div className="h-0.5 bg-slate-800 my-2.5" />
                        <span className="text-[10px] text-slate-400 font-semibold">Buttons: [SaaS, Enterprise]</span>
                      </div>

                      {/* Connection arrow */}
                      <div className="hidden md:block">
                        <ArrowRight className="w-6 h-6 text-green-500 animate-pulse" />
                      </div>
                      <div className="block md:hidden">
                        <ArrowDown className="w-6 h-6 text-green-500 animate-pulse" />
                      </div>

                      {/* Flow Node 3 */}
                      <div className="bg-[#121c38] border border-green-500/50 p-4.5 rounded-2xl shadow-lg relative w-52 flex flex-col">
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1">Logic Router</span>
                        <span className="text-xs font-bold text-white">User clicks "Enterprise" {"→"} Route to Agent</span>
                        <div className="h-0.5 bg-slate-800 my-2.5" />
                        <span className="text-[10px] text-slate-400 font-semibold">Targets: Support Team</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official WhatsApp Green Tick Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-900 to-slate-900 text-white relative overflow-hidden">
        {/* Glow light spots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.15),transparent_40%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-6">
              Official Profile Verification
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight">
              Get the Official{" "}
              <span className="text-green-400">WhatsApp Green Verified Tick</span>
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
              Establish trust and build credibility. Let your customers know they are chatting with your official verified business profile. We handle your API profile settings and verification submission process from start to finish at no extra consultancy cost.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-500/10 text-green-400 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Instant Branding</h4>
                  <p className="text-xs text-slate-400 mt-1">Display name visible even if they haven't saved your number.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-500/10 text-green-400 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Higher Conversion</h4>
                  <p className="text-xs text-slate-400 mt-1">Increase message open rates by up to 2x using verified branding.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            {/* Visual Green Tick Verified Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-[340px] text-center shadow-2xl relative">
              {/* Outer pulsing ring */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-green-500/20 animate-pulse-ring" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-green-500/10 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />

              <div className="relative w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-4xl shadow-lg">
                🚀
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-md">
                  <Check className="text-white w-4.5 h-4.5 stroke-[3.5]" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5 mb-1">
                Your Brand Name <CheckCircle2 className="w-4 h-4 text-green-400 fill-white" />
              </h3>
              <p className="text-xs text-green-400 font-bold mb-4">Official Business Account</p>
              
              <div className="h-[1px] bg-white/10 my-4" />
              
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                SK WEBTECH guarantees support throughout the Meta verification check to secure your green tick mark.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* No-Markup Cost Breakdown Section */}
      <section id="pricing-model" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900 tracking-tight">
              Pay Direct Meta Charges.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                Zero Per-Message Markup.
              </span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Save thousands of rupees. We do not charge any commission or markup fees on top of standard Meta WhatsApp billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard BSP cost */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Traditional Providers
                </span>
                <h3 className="text-xl font-bold text-slate-800 mt-4 mb-2">Per-Message Markup Cost</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                  Many providers charge a premium markup on every incoming and outgoing session message, making high-volume campaigns extremely expensive.
                </p>
                <div className="flex items-baseline gap-1.5 mb-6 text-slate-800">
                  <span className="text-2xl font-black">Meta Charges</span>
                  <span className="text-sm font-bold text-rose-500">+ ₹0.15 - ₹0.25 / message Markup</span>
                </div>
              </div>
              <div className="space-y-3.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>10,000 Messages cost</span>
                  <span className="text-rose-500">~ ₹7,500</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[85%] rounded-full" />
                </div>
              </div>
            </div>

            {/* SK WEBTECH cost */}
            <div className="bg-white border-2 border-green-500 rounded-3xl p-8 shadow-xl shadow-green-500/5 flex flex-col justify-between relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-green-600 to-green-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                Highly Recommended
              </div>
              <div>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  SK WEBTECH API Platform
                </span>
                <h3 className="text-xl font-bold text-slate-800 mt-4 mb-2">Direct Billing via Meta</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                  Integrate your Meta Business Manager billing directly. Pay Meta directly using your card. We charge zero per-message markup costs.
                </p>
                <div className="flex items-baseline gap-1.5 mb-6 text-slate-800">
                  <span className="text-2xl font-black">Meta Charges</span>
                  <span className="text-sm font-bold text-green-600">+ ₹0.00 Markup</span>
                </div>
              </div>
              <div className="space-y-3.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>10,000 Messages cost</span>
                  <span className="text-green-600 font-extrabold">~ ₹4,800 (Save 35%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[48%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900 tracking-tight">
              A Complete Suite to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                Engage & Automate
              </span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">
              We provide all the developer APIs, campaign builders, and interfaces required to run high-volume sales operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-6 shadow-md shadow-green-500/10 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Smart Campaigns</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Schedule bulk promotional broadcasts. Segment customer contacts using filters and tags, and import contacts seamlessly via CSV.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-6 shadow-md shadow-green-500/10 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No-Code Chatbots</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Set up automated response flows with a visual drag-and-drop builder. Resolve support queries instantly without human delay.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-6 shadow-md shadow-green-500/10 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Shared Team Inbox</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Bring sales & support teams onto one WhatsApp number. Assign, tag, and transfer conversations to agents for live support.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-6 shadow-md shadow-green-500/10 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Real-Time Analytics</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Track delivered, read, failed, and clicked metrics. Monitor agent response times and chatbot resolution rates in real-time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-6 shadow-md shadow-green-500/10 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Meta Official API</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Built directly on WhatsApp Cloud API. Say goodbye to number bans, phone-heating issues, or unreliable browser extension hacks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 hover:bg-white hover:border-green-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-6 shadow-md shadow-green-500/10 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Secure & Compliant</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Enterprise-grade security. End-to-end encrypted databases protect customer details and contact lists. Compliance-first architecture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faqs" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-100/40 border-t border-slate-200/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900 tracking-tight">
              Frequently Asked{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                Questions
              </span>
            </h2>
            <p className="text-slate-500 font-medium">
              Have questions about pricing, setup, or features? We've got you covered.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="font-bold text-slate-800 pr-4">{item.q}</span>
                    <div className="flex-shrink-0 p-1 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[250px] border-t border-slate-100" : "max-h-0"
                    }`}
                  >
                    <p className="px-6 py-5 text-sm text-slate-500 leading-relaxed font-medium">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-green-900 to-slate-900 text-white rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_50%)]" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 tracking-tight leading-tight">
              Ready to Upgrade Your Customer Communication?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg mb-10 font-medium">
              Create your account in 5 minutes and see the difference. Join hundreds of growing Indian businesses using SK WEBTECH to drive revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-slate-950 font-extrabold px-9 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/35 hover:-translate-y-1 text-base flex items-center justify-center gap-2"
              >
                Create Free Account
              </Link>
              <Link
                href="/support"
                className="w-full sm:w-auto border border-white/20 hover:border-white/50 hover:bg-white/5 text-white font-extrabold px-9 py-4 rounded-2xl transition-all duration-300 text-base"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <Link href="/">
            <Image src="/logo.png" alt="SK WEBTECH" width={160} height={160} className="h-20 w-auto" />
          </Link>

          <div className="flex items-center gap-3.5 text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-2">
            <span>INNOVATE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span>DEVELOP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span>ELEVATE</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400 font-medium mt-2">
            <Link href="/support" className="hover:text-green-400 transition-colors">Support</Link>
            <span className="text-slate-800">|</span>
            <Link href="/login" className="hover:text-green-400 transition-colors">Sign In</Link>
            <span className="text-slate-800">|</span>
            <Link href="/signup" className="hover:text-green-400 transition-colors">Get Started</Link>
            <span className="text-slate-800">|</span>
            <Link href="/privacy-policy" className="hover:text-green-400 transition-colors">Privacy Policy</Link>
          </div>

          <div className="h-[1px] w-full bg-slate-800/80 my-4" />

          <p className="text-xs text-slate-600 font-semibold">
            &copy; {new Date().getFullYear()} SK WEBTECH. All rights reserved. Built with love in India.
          </p>
        </div>
      </footer>
    </div>
  );
}
