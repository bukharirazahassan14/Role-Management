"use client";

import { useState } from "react";
// Imported 11 icons: Lock + 10 evaluation icons
import {
  Lock,
  Lightbulb,
  Users,
  Clock,
  MessageSquare,
  TrendingUp,
  Target,
  Settings,
  Zap,
  Shield,
  Trophy,
  Diamond,
  BarChart3,
  Star,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
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
        const fullName = `${data.user.firstName || ""} ${
          data.user.lastName || ""
        }`.trim();
        setMessage("✅ Login successful! Welcome " + fullName);

        // Save basic user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("loginID", data.user.id);
        localStorage.setItem("userName", fullName);
        localStorage.setItem("userRole", data.user.role);

        // 🔥 Step 2: Check user access control (critical)
        const accessRes = await fetch(
          `/api/login/getUserAccessControl?userId=${data.user.id}&roleId=${data.user.roleID}`,
          { method: "GET" }
        );

        const accessData = await accessRes.json();

        if (!accessRes.ok) {
          setMessage("❌ Access control check failed.");
          return;
        }

        // Check login flag from Mongo aggregation
        if (!accessData.login) {
          setMessage(
            "❌ You don’t have permission to log in. Please contact admin."
          );
          return;
        }

        // ✅ Save user access control data
        localStorage.setItem("userAccess", JSON.stringify(accessData));

        // ✅ Optionally update 'notified' after access check
        fetch("/api/login/update-notified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        }).catch((err) => console.error("Failed to update notified:", err));

        // ✅ Finally, redirect user
        router.replace("/main/dashboard");
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (err) {
      console.error("⚠️ Login Error:", err);
      setMessage("⚠️ Something went wrong.");
    }
  };

  return (
    // Outer container: Full screen, relative for absolute children positioning.
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 relative overflow-hidden p-8">
      {/* ==================================== */}
      {/* 34 DECORATIVE EVALUATION FRAMES (Full Page Fill) */}
      {/* ------------------------------------ */}

      {/* --- Group 1: TOP Section --- */}
      <Frame
        className="top-12 left-1/2 -translate-x-1/2"
        icon={TrendingUp}
        color="green"
        title="Performance Focus"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-8 left-8"
        icon={Lightbulb}
        color="yellow"
        title="Initiative"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-4 left-40 transform rotate-5"
        icon={Target}
        color="red"
        title="Goal Alignment"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-24 left-80 transform -rotate-5"
        icon={Star}
        color="orange"
        title="Recognition"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="top-16 right-16 transform -rotate-3"
        icon={Users}
        color="indigo"
        title="Collaboration"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-4 right-40 transform rotate-2"
        icon={Trophy}
        color="blue"
        title="Achievements"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-32 right-64"
        icon={CheckCircle}
        color="red"
        title="Quality Assurance"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="top-4 left-80 transform rotate-4"
        icon={Diamond}
        color="purple"
        title="High Potential"
        screen="lg:block hidden"
        extraLight
      />

      {/* --- Group 2: BOTTOM Section --- */}
      <Frame
        className="bottom-12 left-1/2 -translate-x-1/2"
        icon={Settings}
        color="gray"
        title="Process Adherence"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-8 left-8 transform -rotate-1"
        icon={Clock}
        color="green"
        title="Dependability"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-4 left-40 transform -rotate-5"
        icon={MessageSquare}
        color="pink"
        title="Feedback Clarity"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-24 left-80 transform rotate-5"
        icon={Shield}
        color="purple"
        title="Data Security"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-16 right-16 transform rotate-4"
        icon={Zap}
        color="orange"
        title="Efficiency"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-4 right-40 transform -rotate-2"
        icon={BarChart3}
        color="blue"
        title="Data Analysis"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-32 right-64"
        icon={Target}
        color="red"
        title="Metrics Tracking"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-4 left-60 transform -rotate-3"
        icon={Diamond}
        color="yellow"
        title="Value Creation"
        screen="lg:block hidden"
        extraLight
      />

      <Frame
        className="top-1/4 left-4 transform rotate-1"
        icon={Shield}
        color="purple"
        title="Compliance"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-1/2 left-4 -translate-y-1/2 transform -rotate-2"
        icon={Zap}
        color="orange"
        title="Speed"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-1/4 left-4 transform -rotate-4"
        icon={Target}
        color="red"
        title="Focus"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-1/3 left-48 transform -rotate-1"
        icon={Clock}
        color="green"
        title="Timeliness"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-1/3 left-48 transform rotate-3"
        icon={Users}
        color="indigo"
        title="Team Spirit"
        screen="lg:block hidden"
        extraLight
      />

      {/* --- Group 4: RIGHT Side --- */}
      <Frame
        className="top-1/4 right-4 transform -rotate-1"
        icon={MessageSquare}
        color="pink"
        title="Communication"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-1/2 right-4 -translate-y-1/2 transform rotate-2"
        icon={Users}
        color="indigo"
        title="Mentorship"
        screen="md:block"
        extraLight
      />
      <Frame
        className="bottom-1/4 right-4 transform rotate-4"
        icon={Shield}
        color="purple"
        title="Reliability"
        screen="md:block"
        extraLight
      />
      <Frame
        className="top-1/3 right-48 transform rotate-1"
        icon={Lightbulb}
        color="yellow"
        title="Creativity"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-1/3 right-48 transform -rotate-3"
        icon={TrendingUp}
        color="green"
        title="Growth Rate"
        screen="lg:block hidden"
        extraLight
      />

      {/* --- Group 5: Center Fills --- */}
      <Frame
        className="top-80 left-1/4 transform rotate-6"
        icon={Star}
        color="blue"
        title="Ambition"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="top-80 right-1/4 transform -rotate-6"
        icon={BarChart3}
        color="pink"
        title="Data Insights"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-80 left-1/4 transform -rotate-4"
        icon={Diamond}
        color="green"
        title="Competency"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-80 right-1/4 transform rotate-4"
        icon={CheckCircle}
        color="indigo"
        title="Verification"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="top-16 left-1/4"
        icon={Target}
        color="red"
        title="Focus Areas"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="bottom-16 right-1/4"
        icon={Zap}
        color="orange"
        title="Agility"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="top-1/2 left-1/4 transform rotate-3"
        icon={Trophy}
        color="yellow"
        title="Impact"
        screen="lg:block hidden"
        extraLight
      />
      <Frame
        className="top-1/2 right-1/4 transform -rotate-3"
        icon={Settings}
        color="gray"
        title="Optimization"
        screen="lg:block hidden"
        extraLight
      />

      {/* ==================================== */}

      {/* --- Main Login Card Container --- */}
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 relative z-20">
        {/* --- Evaluation Management Circle (Reduced Size, Professional Colors) --- */}
        <div className="absolute -top-6 -right-6 w-32 h-32 z-30 pointer-events-none transform rotate-3">
          {/* 💡 PROFESSIONAL GRADIENT: Deep Indigo (Authoritative) to Gold/Orange (Achievement) */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-700 to-amber-500 p-0.5 shadow-xl">
            {/* Center Content */}
            <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center p-2 text-center">
              <Trophy className="w-7 h-7 text-amber-500" />
              <span className="font-bold text-[15px] text-indigo-700 leading-snug p-2">
                WorkSphere
              </span>
            </div>
          </div>
        </div>
        {/* ----------------------------------------------------- */}

        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-full shadow-md">
            <ShieldCheck className="h-10 w-10 text-indigo-600" />
          </div>
        </div>

        {/* Title (ORIGINAL) */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Secure Login
        </h2>

        {/* Message */}
        {message && (
          <div className="mb-4 text-center text-sm text-gray-700">
            {message}
          </div>
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

// Helper component for the frames (Updated to handle extraLight styling)
const Frame = ({
  className,
  icon: Icon,
  color,
  title,
  screen = "sm:block",
  extraLight = false,
}) => {
  const iconColorMap = {
    yellow: "text-yellow-600",
    red: "text-red-600",
    green: "text-green-600",
    indigo: "text-indigo-600",
    pink: "text-pink-600",
    blue: "text-blue-600",
    gray: "text-gray-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  // Set highly transparent, soft styling for the full-page fill effect
  let finalBg = "bg-white/50";
  let finalBorder = "border-gray-200";
  let finalOpacity = "opacity-50";

  if (extraLight) {
    finalBg = "bg-white/40"; // High transparency
    finalOpacity = "opacity-40"; // Subtle appearance
    finalBorder = "border-gray-100";
  }

  // Combine responsive visibility class with others
  const visibilityClass = screen.split(" ")[0];

  return (
    <div
      className={`absolute ${className} z-10 p-3 ${finalBg} border ${finalBorder} rounded-xl shadow-sm ${visibilityClass} hidden ${finalOpacity}`}
    >
      <div className="flex items-center space-x-2">
        <Icon
          className={`h-6 w-6 ${
            iconColorMap[color] || "text-gray-600"
          } flex-shrink-0`}
        />
        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          {title}
        </p>
      </div>
    </div>
  );
};
