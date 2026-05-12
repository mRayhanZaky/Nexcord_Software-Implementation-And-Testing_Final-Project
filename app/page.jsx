"use client";

import "./home.css";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Hash,
  MessageCircle,
  Mic2,
  Send,
  Shield,
  Smile,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  ["Instant Messaging", "Realtime text channels for every conversation.", MessageCircle],
  ["Server Hubs", "Organized spaces for squads, clubs, and creators.", Users],
  ["High Quality Voice", "Clear voice rooms built for long hangouts.", Mic2],
  ["Emoji Reactions", "Fast reactions that keep every chat expressive.", Smile],
];

const channels = ["general", "gaming", "art", "music"];
const messages = [
  ["Nova", "Tonight's launch room is live.", "wide"],
  ["Mika", "Voice channel sounds crystal clear.", "medium"],
  ["Ari", "Dropping the new server theme now.", "full"],
];

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-aurora" />
      <div className="home-grid" />

      <header className="home-header">
        <nav className="home-nav">
          <Link href="/" className="home-brand" aria-label="Nexcord home">
            <Image src="/nexcord_logo.png" alt="Nexcord logo" width={48} height={48} priority />
            <span>Nexcord</span>
          </Link>

          <div className="home-links">
            <a href="#features">Features</a>
            <a href="#explore">Explore</a>
            <a href="#community">Community</a>
          </div>

          <div className="home-actions">
            <Link className="home-login" href="/login">Login</Link>
            <Link className="home-start" href="/signup">Start Glowing</Link>
          </div>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-copy">
          <div className="home-kicker">
            <Sparkles size={16} />
            Glow Chat Platform
          </div>
          <h1>Where every voice glows.</h1>
          <p>The modern home for your communities. Join millions already chatting on Nexcord.</p>
          <div className="home-cta-row">
            <Link className="home-primary" href="/signup">
              Get Started
              <ArrowRight size={21} />
            </Link>
            <a className="home-secondary" href="#explore">Explore Servers</a>
          </div>
        </div>

        <div className="home-preview" aria-label="Nexcord application preview">
          <div className="desktop-app">
            <div className="window-bar">
              <span />
              <span />
              <span />
              <strong>Nexcord Live</strong>
            </div>
            <div className="app-body">
              <aside className="server-rail">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div key={item} className={item === 1 ? "server-dot active" : "server-dot"}>
                    <Sparkles size={18} />
                  </div>
                ))}
              </aside>
              <aside className="channel-rail">
                <p>Channels</p>
                {channels.map((channel, index) => (
                  <div key={channel} className={index === 0 ? "channel active" : "channel"}>
                    <Hash size={15} />
                    {channel}
                  </div>
                ))}
              </aside>
              <section className="chat-panel">
                <div className="chat-top">
                  <div>
                    <strong># general</strong>
                    <span>42 members online</span>
                  </div>
                  <Shield size={20} />
                </div>
                <div className="chat-messages">
                  {messages.map(([name, text, width], index) => (
                    <div className="chat-message" key={name}>
                      <div className={`avatar avatar-${index}`} />
                      <div>
                        <strong>{name}</strong>
                        <p>{text}</p>
                        <span className={`voice-line ${width}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="message-box">
                  Message #general
                  <Send size={17} />
                </div>
              </section>
            </div>
          </div>

          <div className="phone-app">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-top">
                <strong>NEXCORD</strong>
                <span />
              </div>
              {channels.slice(0, 3).map((channel, index) => (
                <div key={channel} className={index === 0 ? "phone-channel active" : "phone-channel"}>
                  # {channel}
                </div>
              ))}
              <div className="phone-users">
                {[0, 1, 2].map((item) => (
                  <div key={item}>
                    <span />
                    <i />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-row" id="features">
        {features.map(([title, desc, Icon], index) => (
          <article className={`feature-card feature-${index}`} key={title}>
            <div>
              <Icon size={26} />
            </div>
            <h2>{title}</h2>
            <p>{desc}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
