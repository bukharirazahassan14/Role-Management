"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // 👇 check DB for resetPassword after email blur
  const handleEmailBlur = async () => {
    if (!email) return;

    try {
      const res = await fetch(`/api/login/check-reset?email=${email}`);
      const data = await res.json();

      if (res.ok && data.resetPassword) {
        setShowConfirmPassword(true);
      } else {
        setShowConfirmPassword(false);
      }
    } catch (err) {
      console.error("Error checking resetPassword:", err);
      setShowConfirmPassword(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (showConfirmPassword && password !== confirmPassword) {
    setMessage("❌ Passwords do not match.");
    return;
  }

  try {
    // step 1: reset password if required
    if (showConfirmPassword) {
      const resetRes = await fetch("/api/login/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resetData = await resetRes.json();
      if (!resetRes.ok) {
        setMessage("❌ " + resetData.error);
        return;
      }
    }

    // step 2: now login
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      const fullName = `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim();
      setMessage("✅ Login successful! Welcome " + fullName);

      localStorage.setItem("loginID", data.user.id);
      localStorage.setItem("userName", fullName);
      localStorage.setItem("userRole", data.user.role);

      router.push("/main/dashboard");
    } else {
      setMessage("❌ " + data.error);
    }
  } catch (err) {
    console.error(err);
    setMessage("⚠️ Something went wrong.");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-full shadow-md">
            <Lock className="h-10 w-10 text-indigo-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Secure Login
        </h2>

        {/* Message */}
        {message && (
          <div className="mb-4 text-center text-sm text-gray-700">{message}</div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur} // 👈 check resetPassword on blur
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* ✅ show only if resetPassword=true */}
          {showConfirmPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
