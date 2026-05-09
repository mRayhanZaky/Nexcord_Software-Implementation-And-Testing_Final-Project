"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  Mic2,
  Radio,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
  Zap,
} from "lucide-react";
import { BrandMark, NebulaShell, Reveal } from "./motion-shell";

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "Realtime social command center",
    title: "Connect beyond messaging.",
    subtitle:
      "NEXCORD turns rooms, friends, squads, and communities into one cinematic place for live conversation.",
    room: "nexus-lounge",
    stat: "24 online",
    accent: "from-cyan-300 via-blue-500 to-violet-500",
    messages: [
      ["Alya", "The whole squad is online."],
      ["Kai", "Drop into voice when ready."],
      ["Nova", "Realtime sync feels instant."],
    ],
  },
  {
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "Communities with presence",
    title: "Build rooms that feel alive.",
    subtitle:
      "Create focused spaces for gaming, study circles, teams, creators, and private communities with live presence baked in.",
    room: "arena-voice",
    stat: "Voice active",
    accent: "from-fuchsia-300 via-violet-500 to-cyan-400",
    messages: [
      ["Mira", "New room is ready."],
      ["Den", "Voice channel opened."],
      ["System", "7 members joined Arena."],
    ],
  },
  {
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "Secure, expressive, AI-ready",
    title: "The future of chat starts here.",
    subtitle:
      "Supabase auth, storage, realtime messaging, and an AI-ready data model give NEXCORD room to grow.",
    room: "future-lab",
    stat: "AI-ready",
    accent: "from-pink-300 via-purple-500 to-sky-400",
    messages: [
      ["Nex AI", "Summaries can come next."],
      ["Rin", "Media sharing pipeline is ready."],
      ["You", "Ship the beautiful version."],
    ],
  },
];

const featureGroups = [
  {
    title: "Conversation",
    text: "Fast room-based messaging, reactions, replies, and presence designed for active communities.",
    items: [
      ["Realtime Messaging", MessageCircle],
      ["Presence Status", Radio],
      ["Reactions & Emojis", Sparkles],
    ],
  },
  {
    title: "Community",
    text: "Organize people into social spaces that feel premium on desktop, tablet, and mobile.",
    items: [
      ["Groups & Rooms", UsersRound],
      ["Voice Channels", Mic2],
      ["Video Ready", Video],
    ],
  },
  {
    title: "Intelligence",
    text: "A Supabase foundation ready for secure auth, storage, AI memory, and semantic features.",
    items: [
      ["AI Features", Bot],
      ["Secure Auth", ShieldCheck],
      ["Protected Data", LockKeyhole],
    ],
  },
];

const stats = [
  ["Realtime", "Supabase-powered messaging pipeline"],
  ["Secure", "Auth, RLS, and protected server routes"],
  ["AI-ready", "Schema prepared for future memory and search"],
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % heroSlides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const activeSlide = heroSlides[currentSlide];

  function goToSlide(index) {
    setCurrentSlide((index + heroSlides.length) % heroSlides.length);
  }

  return (
    <NebulaShell>
      <header className="fixed left-0 right-0 top-0 z-30 px-4 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-[#070a12]/80 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <Link href="/" aria-label="NEXCORD home">
            <BrandMark />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <a className="transition hover:text-white" href="#experience">Experience</a>
            <a className="transition hover:text-white" href="#features">Features</a>
            <a className="transition hover:text-white" href="#trust">Trust</a>
          </div>
          <div className="flex items-center gap-2">
            <Link className="ghost-button min-h-10 px-4" href="/login">Login</Link>
            <Link className="neon-button min-h-10 px-4" href="/signup">Get Started</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative min-h-[92vh] overflow-hidden">
          <AnimatePresence mode="sync">
            <motion.div
              key={currentSlide}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                backgroundImage: `url(${activeSlide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(34,211,238,0.26),transparent_28rem),linear-gradient(90deg,rgba(3,7,18,0.94)_0%,rgba(3,7,18,0.78)_42%,rgba(3,7,18,0.34)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#070a12] to-transparent" />

          <div className="relative z-10 mx-auto grid min-h-[92vh] max-w-6xl items-center gap-10 px-5 pb-16 pt-32 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`copy-${currentSlide}`}
                  initial={{ y: 46, opacity: 0, filter: "blur(14px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -40, opacity: 0, filter: "blur(14px)" }}
                  transition={{ duration: 0.82, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 backdrop-blur-xl">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                    {activeSlide.eyebrow}
                  </div>
                  <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tight text-white drop-shadow-2xl md:text-7xl">
                    {activeSlide.title}
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 drop-shadow-lg">
                    {activeSlide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <Link className="neon-button" href="/signup">
                  Create Account <Zap size={18} />
                </Link>
                <Link className="ghost-button" href="/login">
                  Login
                </Link>
              </motion.div>

              <div className="mt-10 flex items-center gap-3">
                <button
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/15"
                  type="button"
                  onClick={() => goToSlide(currentSlide - 1)}
                  title="Previous slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.title}
                      className={`h-2.5 rounded-full transition-all ${index === currentSlide ? "w-10 bg-cyan-200" : "w-2.5 bg-white/35 hover:bg-white/60"}`}
                      type="button"
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/15"
                  type="button"
                  onClick={() => goToSlide(currentSlide + 1)}
                  title="Next slide"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <HeroProductPreview slide={activeSlide} slideIndex={currentSlide} />
          </div>
        </section>

        <section id="experience" className="mx-auto max-w-6xl px-5 py-12 md:py-20">
          <Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {stats.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
                  <div className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">{title}</div>
                  <p className="mb-0 mt-3 leading-7 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr]">
          <Reveal className="self-center">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-pink-200">Product preview</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">A focused interface for fast social flow.</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
              The app experience is organized around rooms, active members, expressive messages, and a composer that stays out of the way.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <DashboardPreview />
          </Reveal>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">Feature system</p>
              <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Everything has a clear role.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Instead of scattered feature cards, NEXCORD groups the experience into conversation, community, and intelligence.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3">
            {featureGroups.map((group, index) => (
              <Reveal key={group.title} delay={index * 0.08}>
                <motion.article className="glass-panel h-full p-6" whileHover={{ y: -6 }}>
                  <h3 className="text-2xl font-black">{group.title}</h3>
                  <p className="mt-3 min-h-20 leading-7 text-slate-400">{group.text}</p>
                  <div className="mt-6 grid gap-3">
                    {group.items.map(([label, Icon]) => (
                      <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                          <Icon size={18} />
                        </span>
                        <span className="font-bold text-slate-200">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="trust" className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <div className="glass-panel grid gap-8 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-pink-200">Social proof</p>
                <h2 className="mt-4 text-4xl font-black leading-tight">Designed to feel reliable, not noisy.</h2>
                <p className="mt-5 leading-8 text-slate-300">
                  Strong layout, controlled motion, and Supabase-backed architecture make the experience feel premium without losing clarity.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["12K+", "messages modeled"],
                  ["98ms", "sync target"],
                  ["RLS", "policy ready"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/35 p-5 text-center">
                    <div className="text-3xl font-black text-white">{value}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-2xl md:p-14">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">Join NEXCORD</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Create your space and start the next conversation.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">
                Move from scattered messages into a designed social command center for people, communities, and real-time presence.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link className="neon-button" href="/signup">Create Account</Link>
                <Link className="ghost-button" href="/login">Login</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-white/10 px-5 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <BrandMark />
        <div className="flex gap-5">
          <a href="#experience">Experience</a>
          <a href="#features">Features</a>
          <a href="#trust">Trust</a>
        </div>
        <span>Copyright 2026 NEXCORD</span>
      </footer>
    </NebulaShell>
  );
}

function HeroProductPreview({ slide, slideIndex }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-cyan-400/10 blur-3xl" />
      <div className="glass-panel relative mx-auto max-w-2xl overflow-hidden p-3">
        <div className="rounded-[22px] border border-white/10 bg-[#080d1a]/88 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-sm font-black">NEXCORD Live</div>
              <div className="text-xs text-slate-500"># {slide.room}</div>
            </div>
            <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">{slide.stat}</div>
          </div>
          <div className="grid min-h-[390px] grid-cols-[132px_minmax(0,1fr)]">
            <div className="border-r border-white/10 p-3">
              {["nexus", "squad", "voice"].map((room, index) => (
                <div key={room} className={`mb-2 rounded-2xl px-3 py-3 text-sm ${index === 0 ? "bg-cyan-300/15 text-cyan-100" : "text-slate-500"}`}>
                  # {room}
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`preview-${slideIndex}`}
                  className="space-y-3"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45 }}
                >
                  {slide.messages.map(([name, text], index) => (
                    <ChatBubble key={`${name}-${text}`} name={name} text={text} align={index === 1 ? "right" : undefined} />
                  ))}
                </motion.div>
              </AnimatePresence>
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                Presence synced across the room
              </div>
            </div>
          </div>
          <div className={`h-1 bg-gradient-to-r ${slide.accent}`} />
        </div>
      </div>
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <div className="glass-panel overflow-hidden p-3">
      <div className="grid rounded-[24px] border border-white/10 bg-[#080d1a]/80 md:grid-cols-[180px_minmax(0,1fr)_160px]">
        <aside className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
          <div className="mb-5 text-sm font-black">Rooms</div>
          {["General", "Creators", "Voice Lounge", "Support"].map((item, index) => (
            <div key={item} className={`mb-2 rounded-2xl px-3 py-2 text-sm ${index === 0 ? "bg-violet-400/15 text-violet-100" : "text-slate-500"}`}>
              {item}
            </div>
          ))}
        </aside>
        <section className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <strong># general</strong>
              <p className="m-0 text-xs text-slate-500">Realtime discussion</p>
            </div>
            <Radio className="text-emerald-300" size={18} />
          </div>
          <div className="space-y-3">
            <ChatBubble name="Alya" text="Ship the beautiful version, but keep it readable." />
            <ChatBubble name="Den" text="Agreed. Motion supports the story now." align="right" />
            <ChatBubble name="System" text="New member joined the room." />
          </div>
        </section>
        <aside className="border-t border-white/10 p-4 md:border-l md:border-t-0">
          <div className="mb-4 text-sm font-black">Online</div>
          {["Alya", "Den", "Nova"].map((name) => (
            <div key={name} className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400" />
              {name}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function ChatBubble({ name, text, align }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[82%] rounded-3xl border border-white/10 bg-white/[0.055] p-3">
        <div className="mb-1 text-xs font-bold text-cyan-200">{name}</div>
        <div className="text-sm leading-6 text-slate-200">{text}</div>
      </div>
    </div>
  );
}
