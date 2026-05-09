"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Mail, ShieldQuestion } from "lucide-react";
import { isEmail, passwordError } from "@/lib/auth/validation";
import { BrandMark, NebulaShell } from "./motion-shell";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function lookup(event) {
    event.preventDefault();
    setNotice("");
    if (!isEmail(email)) return setNotice("Enter a valid email address.");

    setLoading(true);
    const response = await fetch("/api/auth/forgot/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) return setNotice(data.message);
    setUserId(data.userId);
    setSecretQuestion(data.secretQuestion);
    setStep(2);
  }

  async function reset(event) {
    event.preventDefault();
    setNotice("");
    const validation = passwordError(password);
    if (validation) return setNotice(validation);
    if (password !== confirmPassword) return setNotice("Passwords do not match.");

    setLoading(true);
    const response = await fetch("/api/auth/forgot/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, secretAnswer, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) return setNotice(data.message);
    setStep(3);
    setNotice("Password reset complete.");
  }

  return (
    <NebulaShell>
      <main className="grid min-h-screen place-items-center px-5 py-16">
        <motion.section className="glass-panel w-[min(100%,520px)] p-7" initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
          <BrandMark />
          <h1 className="mt-8 text-3xl font-black">Recover Your Access</h1>
          <p className="mt-2 text-slate-400">A secure multi-step reset using your recovery question.</p>
          <div className="my-6 grid grid-cols-3 gap-2">
            {["Verify Email", "Secret Answer", "Reset Done"].map((label, index) => (
              <div key={label} className={`rounded-2xl border px-3 py-2 text-xs ${step >= index + 1 ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-500"}`}>{label}</div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="lookup" className="auth-form" onSubmit={lookup} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <div className="field">
                  <label>Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input className="pl-10" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@gmail.com" />
                  </div>
                </div>
                <button className="neon-button w-full" disabled={loading} type="submit">{loading ? "Checking..." : "Verify Email"}</button>
              </motion.form>
            ) : null}

            {step === 2 ? (
              <motion.form key="reset" className="auth-form" onSubmit={reset} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <div className="field">
                  <label>Security Question</label>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200">
                    <ShieldQuestion className="mb-2 text-cyan-200" size={18} />
                    {secretQuestion}
                  </div>
                </div>
                <div className="field">
                  <label>Secret Answer</label>
                  <input value={secretAnswer} onChange={(event) => setSecretAnswer(event.target.value)} placeholder="Secret Answer" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="field">
                    <label>New Password</label>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New Password" />
                  </div>
                  <div className="field">
                    <label>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm Password" />
                  </div>
                </div>
                <button className="neon-button w-full" disabled={loading} type="submit">{loading ? "Resetting..." : "Reset Password"}</button>
              </motion.form>
            ) : null}

            {step === 3 ? (
              <motion.div key="done" className="text-center" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
                <KeyRound className="mx-auto mb-4 text-cyan-200" size={42} />
                <h2 className="text-2xl font-black">Access restored</h2>
                <p className="text-slate-400">Your password has been updated.</p>
                <Link className="neon-button mt-4" href="/login">Return to Login</Link>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {notice ? <motion.p className={step === 3 ? "form-success" : "form-error"} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.p> : null}
        </motion.section>
      </main>
    </NebulaShell>
  );
}
