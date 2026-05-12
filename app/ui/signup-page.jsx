"use client";

import "./auth.css";
import "react-phone-number-input/style.css";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { motion } from "framer-motion";
import { AtSign, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound, XCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isEmail, passwordError, passwordScore, secretQuestions, usernameError } from "@/lib/auth/validation";
import { BrandMark, NebulaShell } from "./motion-shell";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    secretQuestion: secretQuestions[0],
    secretAnswer: "",
  });
  const [usernameState, setUsernameState] = useState({ checking: false, available: null, message: "" });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const usernameValidation = usernameError(form.username);
  const pwdError = passwordError(form.password);
  const pwdScore = passwordScore(form.password);
  const passwordsMatch = form.password && form.password === form.confirmPassword;

  useEffect(() => {
    if (usernameValidation) {
      setUsernameState({ checking: false, available: null, message: usernameValidation });
      return;
    }

    setUsernameState((current) => ({ ...current, checking: true, message: "Checking username..." }));
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(form.username)}`);
      const data = await response.json();
      setUsernameState({ checking: false, available: data.available, message: data.message });
    }, 450);

    return () => clearTimeout(handle);
  }, [form.username, usernameValidation]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setNotice("");

    if (!form.fullName.trim()) return setNotice("Full name is required.");
    if (usernameValidation || usernameState.available === false) return setNotice(usernameState.message || "Choose another username.");
    if (!isEmail(form.email)) return setNotice("Enter a valid email address.");
    if (!form.phoneNumber || !isValidPhoneNumber(form.phoneNumber)) return setNotice("Enter a valid phone number.");
    if (pwdError) return setNotice(pwdError);
    if (!passwordsMatch) return setNotice("Passwords do not match.");
    if (!form.secretAnswer.trim()) return setNotice("Secret answer is required.");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username,
          phone_number: form.phoneNumber,
        },
      },
    });

    if (error) {
      setLoading(false);
      setNotice(error.message);
      return;
    }

    const profileResponse = await fetch("/api/auth/register-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userId: data.user?.id }),
    });
    const profile = await profileResponse.json();
    setLoading(false);

    if (!profileResponse.ok) {
      setNotice(profile.message ?? "Could not finish profile setup.");
      return;
    }

    setNotice("Account created. Redirecting...");
    setTimeout(() => router.push("/app"), 650);
  }

  return (
    <NebulaShell>
      <main className="auth-stage">
        <section className="auth-visual">
          <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.72 }}>
            <BrandMark />
            <h1 className="mt-10">Create your signal</h1>
            <p>Build your identity for rooms, squads, friend circles, and communities that move in realtime.</p>
          </motion.div>
        </section>
        <section className="auth-form-side">
          <motion.div className="auth-card glass-panel w-[min(100%,560px)]" initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            <h2>Create Account</h2>
            <p>Every field shapes your secure NEXCORD profile.</p>
            <form className="auth-form" onSubmit={submit}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Full Name" value={form.fullName} onChange={(value) => update("fullName", value)} placeholder="Full Name" icon={<UserRound size={18} />} />
                <div className="field">
                  <label>Username</label>
                  <div className="input-shell">
                    <AtSign className="input-icon" size={18} />
                    <input className="has-action" value={form.username} onChange={(event) => update("username", event.target.value.replace(/\s/g, ""))} placeholder="Username" />
                    {usernameState.available ? <CheckCircle2 className="input-status text-emerald-300" size={18} /> : null}
                    {usernameState.available === false ? <XCircle className="input-status text-rose-300" size={18} /> : null}
                  </div>
                  {usernameState.message ? <span className={usernameState.available ? "form-success" : "form-error"}>{usernameState.message}</span> : null}
                </div>
              </div>
              <Field label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="Email" icon={<Mail size={18} />} />
              <div className="field">
                <label>Phone Number</label>
                <PhoneInput defaultCountry="ID" international countryCallingCodeEditable={false} value={form.phoneNumber} onChange={(value) => update("phoneNumber", value ?? "")} />
                {form.phoneNumber && !isValidPhoneNumber(form.phoneNumber) ? <span className="form-error">Invalid phone number.</span> : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <PasswordField label="Password" value={form.password} onChange={(value) => update("password", value)} />
                <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={(value) => update("confirmPassword", value)} />
              </div>
              <div className="strength-track">
                <div className="strength-bar" style={{ width: `${(pwdScore / 5) * 100}%` }} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="field">
                  <label>Secret Question</label>
                  <select value={form.secretQuestion} onChange={(event) => update("secretQuestion", event.target.value)}>
                    {secretQuestions.map((question) => <option key={question}>{question}</option>)}
                  </select>
                </div>
                <Field label="Secret Answer" value={form.secretAnswer} onChange={(value) => update("secretAnswer", value)} placeholder="Secret Answer" />
              </div>
              {notice ? <motion.p className={notice.includes("created") ? "form-success" : "form-error"} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.p> : null}
              <button className="neon-button w-full" type="submit" disabled={loading || usernameState.checking}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-400">
              Already have an account? <Link className="font-bold text-cyan-300 transition hover:text-white" href="/login">Login</Link>
            </p>
          </motion.div>
        </section>
      </main>
    </NebulaShell>
  );
}

function Field({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className={icon ? "input-shell" : ""}>
        {icon ? <span className="input-icon">{icon}</span> : null}
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="field">
      <label>{label}</label>
      <div className="input-shell">
        <LockKeyhole className="input-icon" size={18} />
        <input 
          className="has-action"
          type={showPassword ? "text" : "password"} 
          value={value} 
          onChange={(event) => onChange(event.target.value)} 
          placeholder={label} 
        />
        <button 
          className="input-action"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          title="Toggle password visibility"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
