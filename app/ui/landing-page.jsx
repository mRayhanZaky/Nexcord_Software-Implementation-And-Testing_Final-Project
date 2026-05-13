"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Smile, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-landing">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-landing-gradient" />
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-transparent rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-transparent rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50">
        <nav className="flex items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 font-bold text-xl"
          >
            <Image className="w-8 h-8 rounded-lg object-contain shadow-[0_0_22px_rgba(59,130,246,0.45)]" src="/nexcord_logo.png" alt="Nexcord logo" width={32} height={32} />
            <span className="text-white">Nexcord</span>
          </motion.div>

          {/* Center Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            {["Features", "Explore", "Community"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                {item}
              </a>
            ))}
          </motion.div>

          {/* Right Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Link
              href="/login"
              className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium rounded-full hover:shadow-lg hover:shadow-violet-500/50 transition-all"
            >
              Start Glowing
            </Link>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-300 via-violet-400 to-pink-300 bg-clip-text text-transparent">
                WHERE EVERY VOICE GLOWS
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-lg">
              The modern home for your communities, connections, and creations.
              Join millions already chatting, sharing, and shining together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/signup"
                className="group px-8 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold rounded-full hover:shadow-xl hover:shadow-violet-500/50 transition-all hover:scale-105 flex items-center gap-2 justify-center"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-3 border border-white/30 text-white font-semibold rounded-full hover:bg-white/5 hover:border-white/50 transition-all">
                Explore Servers
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { label: "Active Users", value: "2.5M+" },
                { label: "Communities", value: "500K+" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-300 to-violet-400 bg-clip-text">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Floating UI Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative h-96 md:h-full"
          >
            {/* Desktop Preview */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-full max-w-sm bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-violet-600 rounded-lg" />
                    <div>
                      <div className="text-sm font-semibold text-white">
                        General
                      </div>
                      <div className="text-xs text-gray-400">28 online</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-white/10 rounded-lg" />
                    <div className="w-6 h-6 bg-white/10 rounded-lg" />
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 min-h-48">
                  {[
                    {
                      name: "Alex",
                      msg: "Just launched my stream!",
                      color: "from-pink-500 to-rose-500",
                    },
                    {
                      name: "Jordan",
                      msg: "That sounds amazing!",
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      name: "Casey",
                      msg: "Count me in!",
                      color: "from-violet-500 to-purple-500",
                    },
                  ].map((msg) => (
                    <div key={msg.name} className="flex gap-2">
                      <div
                        className={`w-8 h-8 bg-gradient-to-br ${msg.color} rounded-full flex-shrink-0`}
                      />
                      <div>
                        <div className="text-xs font-semibold text-gray-300">
                          {msg.name}
                        </div>
                        <div className="text-sm text-gray-400">{msg.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="px-4 py-3 border-t border-white/10 flex gap-2 bg-slate-900/50">
                  <div className="flex-1 bg-slate-800/50 rounded-lg px-3 py-2 text-xs text-gray-400 border border-white/5">
                    Type something...
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-violet-600 rounded-lg flex-shrink-0" />
                </div>
              </div>
            </motion.div>

            {/* Mobile Preview - Overlapped */}
            <motion.div
              animate={{ y: [0, 10, 0], x: [0, -10, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
              className="absolute bottom-0 right-0 w-40 h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-900 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-white">NEXCORD</div>
                  <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full" />
                </div>
                <div className="space-y-2 flex-1 text-xs text-gray-300">
                  <div className="bg-white/10 rounded p-2">Hey everyone!</div>
                  <div className="bg-white/10 rounded p-2 ml-auto">
                    Love this!
                  </div>
                  <div className="bg-gradient-to-r from-violet-500/30 to-blue-500/30 rounded p-2">
                    Amazing
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg px-2 py-1.5 mt-auto text-gray-400">
                  Message...
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to connect and collaborate
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageCircle,
                title: "Instant Messaging",
                desc: "Lightning-fast text communication with real-time delivery",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Users,
                title: "Server Hubs",
                desc: "Organize communities with channels and categories",
                color: "from-violet-500 to-purple-500",
              },
              {
                icon: Zap,
                title: "High Quality Voice",
                desc: "Crystal clear audio and video for your conversations",
                color: "from-pink-500 to-rose-500",
              },
              {
                icon: Smile,
                title: "Emoji Reactions",
                desc: "Express yourself with reactions and interactive elements",
                color: "from-amber-500 to-orange-500",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 backdrop-blur-xl hover:border-white/30 transition-all hover:shadow-xl"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to start glowing?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join millions of users creating, connecting, and celebrating
              together on Nexcord.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-violet-500/50 transition-all hover:scale-105"
            >
              Create Your Account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-8 mt-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-400">
          <div>(c) 2026 Nexcord. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
