"use client";

import "./forgot-password.css";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck } from "lucide-react";
import { isEmail, passwordError } from "@/lib/auth/validation";

const methods = [
  { id: "email", label: "Email Verification", icon: Mail },
  { id: "phone", label: "Phone Number", icon: Phone },
];

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState("email");
  const [step, setStep] = useState("identify");
  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function lookup(event) {
    event.preventDefault();
    setNotice("");

    if (method === "email" && !isEmail(identifier)) {
      setNotice("Enter a valid email address.");
      return;
    }

    if (method === "phone" && identifier.trim().length < 8) {
      setNotice("Enter your registered phone number with country code.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/forgot/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, identifier }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setNotice(data.message);
      return;
    }

    setUserId(data.userId);
    setNotice(data.message ?? "Verification code prepared. For now, use 123456.");
    setStep("otp");
  }

  function verifyOtp(event) {
    event.preventDefault();
    setNotice("");

    if (otp.trim() !== "123456") {
      setNotice("Use the temporary code 123456.");
      return;
    }

    setStep("password");
  }

  async function reset(event) {
    event.preventDefault();
    setNotice("");

    const validation = passwordError(password);
    if (validation) {
      setNotice(validation);
      return;
    }

    if (password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/forgot/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, otp, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setNotice(data.message);
      return;
    }

    setNotice("Password reset successful. You can now log in with your new password.");
    setStep("done");
  }

  const activeMethod = methods.find((item) => item.id === method);
  const ActiveIcon = activeMethod.icon;

  return (
    <main className="forgot-page">
      <div className="forgot-stars" />

      <section className="forgot-form-side">
        <div className="forgot-card">
          <div className="forgot-card-head">
            <div className="forgot-icon">
              <KeyRound size={24} />
            </div>
            <div>
              <h1>Reset Your Password</h1>
              <p>Verify your account, enter the temporary OTP, then choose a new password.</p>
            </div>
          </div>

          <div className="forgot-tabs" role="tablist" aria-label="Reset method">
            {methods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={method === id ? "active" : ""}
                onClick={() => {
                  setMethod(id);
                  setIdentifier("");
                  setNotice("");
                }}
                disabled={step !== "identify"}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          <div className="forgot-steps" aria-label="Reset progress">
            {["Account", "OTP", "Password"].map((label, index) => {
              const currentIndex = ["identify", "otp", "password", "done"].indexOf(step);
              return (
                <span key={label} className={currentIndex >= index ? "active" : ""}>
                  {label}
                </span>
              );
            })}
          </div>

          {step === "identify" ? (
            <form className="forgot-form" onSubmit={lookup}>
              <label>{method === "email" ? "Registered Email Address" : "Registered Phone Number"}</label>
              <div className="forgot-input">
                <ActiveIcon size={18} />
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={method === "email" ? "you@nexcord.com" : "+62 812 3456 7890"}
                  inputMode={method === "email" ? "email" : "tel"}
                />
              </div>
              <button className="forgot-primary" disabled={loading} type="submit">
                {loading ? "Checking..." : "Send Verification Code"}
              </button>
            </form>
          ) : null}

          {step === "otp" ? (
            <form className="forgot-form" onSubmit={verifyOtp}>
              <div className="forgot-note">
                <ShieldCheck size={18} />
                We found your account. Real delivery will be configured later. For now, use OTP <strong>123456</strong>.
              </div>
              <label>Six Digit Verification Code</label>
              <div className="forgot-input">
                <ShieldCheck size={18} />
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
              <button className="forgot-primary" type="submit">Verify Code</button>
            </form>
          ) : null}

          {step === "password" ? (
            <form className="forgot-form" onSubmit={reset}>
              <label>New Password</label>
              <div className="forgot-input">
                <KeyRound size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                />
                <button className="forgot-eye" type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <label>Confirm Password</label>
              <div className="forgot-input">
                <KeyRound size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                />
              </div>
              <button className="forgot-primary" disabled={loading} type="submit">
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="forgot-done">
              <CheckCircle2 size={52} />
              <h2>Password Reset Successful</h2>
              <p>You can now log in with your new password.</p>
              <Link className="forgot-primary" href="/login">Back to Login</Link>
            </div>
          ) : null}

          {notice ? <p className={step === "done" ? "forgot-success" : "forgot-error"}>{notice}</p> : null}
        </div>
      </section>

      <section className="forgot-logo-side" aria-label="Nexcord brand">
        <div className="forgot-orbit">
          <Image src="/nexcord_logo.png" alt="Nexcord logo" width={260} height={260} priority />
        </div>
        <h2>NEXCORD</h2>
        <p>Connecting Communities</p>
      </section>
    </main>
  );
}
