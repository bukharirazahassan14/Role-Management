"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const fullName = `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim();
        setMessage("✅ Login successful! Welcome " + fullName);

        localStorage.setItem("token", data.token);
        localStorage.setItem("loginID", data.user.id);
        localStorage.setItem("userName", fullName);
        localStorage.setItem("userRole", data.user.role);

        router.replace("/main/dashboard");
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
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md"
          >
            Login
          </button>

          {/* Forgot Password */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
