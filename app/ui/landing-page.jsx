"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogIn, Sparkles, UserPlus, UsersRound } from "lucide-react";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=2200&q=88",
    kicker: "Featured Festivals",
    title: "Find the Best Live Events Near You",
    subtitle: "Tickets, schedules, and premium experiences — all in one elegant event hub.",
  },
  {
    image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=2200&q=88",
    kicker: "Designed for discovery",
    title: "Explore Concerts, Sports, and Culture",
    subtitle: "From local meetups to headline shows, discover every event with a modern booking experience.",
  },
  {
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=88",
    kicker: "Secure your spot",
    title: "Create Your Account and Join the Moment",
    subtitle: "Sign up now to book tickets faster, save favorites, and never miss another live experience.",
  },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % heroSlides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050712] text-white">
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 5.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,18,0.94)_0%,rgba(20,13,56,0.76)_42%,rgba(5,7,18,0.34)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,7,18,0.24)_0%,rgba(43,19,91,0.38)_54%,rgba(5,7,18,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.28),transparent_24rem),radial-gradient(circle_at_88%_16%,rgba(244,114,182,0.26),transparent_28rem)]" />

      <header className="absolute left-0 right-0 top-0 z-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 md:px-10">
          <Link className="flex items-center gap-4" href="/" aria-label="Event hub home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 via-fuchsia-500 to-violet-700 text-xl font-black shadow-[0_0_32px_rgba(251,146,60,0.42)] md:h-12 md:w-12">
              E
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/80">Live Events</p>
              <span className="block text-2xl font-black tracking-tight md:text-4xl">NEXCORD</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/18 md:px-6 md:py-3 md:text-base" href="/login">
              Login
            </Link>
            <Link className="rounded-full bg-white px-4 py-2.5 text-sm font-black text-[#271047] shadow-2xl shadow-fuchsia-950/40 transition hover:scale-[1.03] md:px-6 md:py-3 md:text-base" href="/signup">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 pb-28 pt-28 md:px-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentSlide}`}
                initial={{ y: 54, opacity: 0, filter: "blur(15px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -54, opacity: 0, filter: "blur(15px)" }}
                transition={{ duration: 1.15, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl md:text-sm">
                  <Sparkles size={16} />
                  {slide.kicker}
                </div>
                <h1 className="max-w-5xl text-left text-5xl font-black uppercase leading-[0.9] text-white drop-shadow-[0_10px_38px_rgba(0,0,0,0.64)] sm:text-6xl md:text-7xl lg:text-8xl">
                  {slide.title}
                </h1>
                <motion.p
                  className="mt-7 max-w-3xl text-left text-lg leading-8 text-white/88 drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] md:text-2xl md:leading-9"
                  initial={{ y: 34, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -34, opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 1.15, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {slide.subtitle}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row"
              initial={{ y: 34, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Link className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-white px-7 text-base font-black text-[#1c0c37] shadow-[0_22px_70px_rgba(139,92,246,0.42)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(34,211,238,0.3)]" href="/signup">
                <UserPlus size={20} />
                Create Account
                <ArrowRight size={19} />
              </Link>
              <Link className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-7 text-base font-bold text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/18" href="/login">
                <LogIn size={20} />
                Login
              </Link>
            </motion.div>
          </div>

          <motion.aside
            className="hidden rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.36)] backdrop-blur-2xl lg:block"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300 to-fuchsia-500 text-white shadow-[0_0_32px_rgba(249,115,22,0.28)]">
                <Sparkles size={28} />
              </div>
              <div>
                <p className="m-0 text-sm font-bold uppercase tracking-[0.18em] text-orange-100/80">Live Experiences</p>
                <h2 className="m-0 text-2xl font-black">Your next event starts here</h2>
              </div>
            </div>
            <div className="mt-7 grid gap-3">
              {["Instant ticket booking", "Curated event collections", "Secure checkout"].map((feature, index) => (
                <div key={feature} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                  <span className="font-semibold text-white/90">{feature}</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.75)]" style={{ opacity: 1 - index * 0.2 }} />
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/12 bg-[#16092f]/82 px-5 py-5 shadow-[0_-28px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 via-fuchsia-500 to-violet-700 text-xl font-black shadow-[0_0_30px_rgba(249,115,22,0.42)]">
              E
            </span>
            <div>
              <p className="m-0 text-2xl font-black leading-none md:text-3xl">NEXCORD</p>
              <p className="m-0 mt-1 text-sm text-white/62">Live events made effortless.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-6 font-bold text-white transition hover:bg-white/18" href="/login">
              <LogIn size={18} />
              Login
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 font-black text-[#271047] transition hover:scale-[1.03]" href="/signup">
              <UserPlus size={18} />
              Create Account
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-36 left-0 right-0 z-20 flex justify-center gap-3 md:bottom-32">
        {heroSlides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`h-3 rounded-full transition-all ${index === currentSlide ? "w-14 bg-white" : "w-3 bg-white/35 hover:bg-white/70"}`}
            aria-label={`Show slide ${index + 1}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </main>
  );
}
