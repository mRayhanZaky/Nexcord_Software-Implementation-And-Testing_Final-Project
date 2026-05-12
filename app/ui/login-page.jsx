"use client";

import "./auth.css";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, Radio } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isEmail } from "@/lib/auth/validation";
import { BrandMark, NebulaShell } from "./motion-shell";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (!remember) {
      window.sessionStorage.setItem("nexcord-session-mode", "temporary");
    }

    setSuccess("Welcome back. Opening your command center...");
    setTimeout(() => router.push("/app"), 550);
  }

  return (
    <NebulaShell>
      <main className="auth-stage">
        <section className="auth-visual">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <BrandMark />
            <h1 className="mt-10">Welcome back to the future</h1>
            <p>Reconnect to your rooms, live communities, and private conversations in a secure realtime space.</p>
            <motion.div className="glass-panel mt-8 max-w-md p-5" animate={{ y: [0, -14, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                  <Radio size={18} />
                </span>
                <div className="min-w-0">
                  <strong className="block text-sm font-black text-white">Realtime Signal Active</strong>
                  <p className="m-0 mt-1 text-sm leading-6 text-slate-400">Presence, messages, and communities are ready.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="auth-form-side">
          <motion.div className="auth-card glass-panel" initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65 }}>
            <h2>Login</h2>
            <p>Enter your credentials to continue.</p>
            <form className="auth-form" onSubmit={submit}>
              <div className="field">
                <label>Email</label>
                <div className="input-shell">
                  <Mail className="input-icon" size={18} />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@gmail.com" />
                </div>
              </div>
              <div className="field">
                <label>Password</label>
                <div className="input-shell">
                  <LockKeyhole className="input-icon" size={18} />
                  <input className="has-action" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
                  <button className="input-action" type="button" onClick={() => setShowPassword((value) => !value)} title="Toggle password visibility">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="toggle">
                  <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
                  Remember Me
                </label>
                <Link className="text-sm text-pink-200" href="/forgot-password">Forgot Password?</Link>
              </div>
              {error ? <motion.p className="form-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p> : null}
              {success ? <motion.p className="form-success" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{success}</motion.p> : null}
              <button className="neon-button w-full" disabled={loading} type="submit">
                {loading ? "Authenticating..." : "Login"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-400">
              New to NEXCORD? <Link className="font-bold text-cyan-300 transition hover:text-white" href="/signup">Create an account</Link>
            </p>
          </motion.div>
        </section>
      </main>
    </NebulaShell>
  );
}
