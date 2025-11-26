"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const CustomStyles = () => (
  <style jsx global>{`
    /* Custom styles for the geometric shapes */
    .geometric-bg {
      width: 100%;
      height: 100vh;
      background-color: #1a237e;
      position: relative;
      overflow: visible;
    }

    @media (min-width: 768px) {
      .geometric-bg {
        width: 40%;
      }
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      opacity: 0.9;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      left: -100px;
      background-color: #4a148c;
      z-index: 10;
    }

    .shape-2 {
      width: 150px;
      height: 150px;
      top: 200px;
      right: -75px;
      left: auto;
      background-color: #6a1b9a;
      z-index: 20;
    }

    .shape-3 {
      width: 350px;
      height: 350px;
      bottom: 50px;
      right: -100px;
      background-color: #f48fb1;
      z-index: 10;
    }

    .shape-4 {
      width: 200px;
      height: 200px;
      bottom: -0px;
      left: 30%;
      background-color: #3f51b5;
      z-index: 5;
    }

    .content-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `}</style>
);

// Shim for Next.js router functions to use standard browser redirection
const router = {
  // Replaces the current history state, similar to router.replace
  replace: (path) => {
    window.location.replace(path);
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [forms, setForms] = useState([]);

  // Fetch Forms Logic
  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await fetch("/api/UserAccessControl", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch forms");
        const data = await res.json();
        setForms(data);
      } catch (error) {
        console.error("❌ Error loading forms:", error);
      }
    }

    fetchForms();
  }, []);

  // Login Submission Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

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

        // ✅ Save basic user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("loginID", data.user.id);
        localStorage.setItem("userName", fullName);
        localStorage.setItem("userRole", data.user.role);

        // 🔥 Step 2: Check user access control
        const accessRes = await fetch(
          `/api/login/getUserAccessControl?userId=${data.user.id}&roleId=${data.user.roleID}`,
          { method: "GET" }
        );

        const accessData = await accessRes.json();

        if (!accessRes.ok) {
          setMessage("❌ Access control check failed.");
          return;
        }

        // 🚫 Check login permission
        if (!accessData.login) {
          setMessage(
            "❌ You don’t have permission to log in. Please contact admin."
          );
          return;
        }

        // ✅ Save user access data
        localStorage.setItem("userAccess", JSON.stringify(accessData));

        // ✅ Update 'notified' flag (non-blocking)
        fetch("/api/login/update-notified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        }).catch((err) => console.error("Failed to update notified:", err));

        // ✅ Determine redirect path
        const formAccess = accessData.formAccess || [];

        // ✅ Find the first allowed form
        const firstAllowed = formAccess.find((f) => {
          if (f.noAccess) return false;
          if (f.fullAccess) return true;
          if (f.partialAccess?.enabled) {
            const perms = f.partialAccess.permissions || {};
            return Object.values(perms).some((val) => val === true);
          }
          return false;
        });

        // ✅ Match formId to form name
        let formName = null;
        let matchedForm = null;

        if (firstAllowed) {
          matchedForm = forms.find((form) => form._id === firstAllowed.formId);
          formName = matchedForm?.name || null;
        }

        // ✅ Redirect user and save active form ID
        if (formName) {
          let path = formName.toLowerCase().replace(/\s+/g, "");
          if (formName === "Report") path = "weeklyevaluation";

          // ✅ Save active form for Sidebar
          if (matchedForm?._id) {
            localStorage.setItem("activeForm", matchedForm._id);
          }

          router.replace(`/main/${path}`);
        } else {
          // Default fallback
          router.replace("/main/dashboard");
        }
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (err) {
      console.error("⚠️ Login Error:", err);
      setMessage("⚠️ Something went wrong.");
    }
  };

  return (
    // Outer container matching HTML layout
    <div className="flex flex-col md:flex-row min-h-screen font-sans bg-white">
      {/* Include the custom styles */}
      <CustomStyles />

      {/* 1. Left Section: Geometric Background (Hidden on Mobile, Visible MD+) */}
      <div className="geometric-bg flex-shrink-0 relative hidden md:block">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>

        <div className="content-overlay p-2">
          <div
            className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
             md:top-auto md:p-12 md:text-left"
            style={{ marginTop: "10rem" }} // Add this to push it down
          >
            {/* Worksphere Logo (Desktop Left Panel) */}
            <div className="text-center">
              <Image
                src="/GreyLoop_Logo-01.png"
                alt="GreyLoop logo"
                
                width={500}
                height={500}
                priority
              />
            </div>

            {/* Worksphere Text */}
            <p
              className="text-lg font-light opacity-80"
              style={{ marginTop: "-0.9rem", marginLeft: "5.9rem" }}
            >
              Worksphere
            </p>
          </div>
        </div>

      </div>

      {/* 2. Right Section: Login Form */}
      <div className="flex-grow flex items-center justify-center p-6 sm:p-12 md:p-20">
        <div className="w-full max-w-sm">
          {/* Welcome Text */}
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Sign In</h2>

          {/* Mobile-Only Logo (Visible BLOCK on Mobile, Hidden SM+) */}
          <div
            className="block sm:hidden text-center"
            style={{
              marginTop: "-6.1rem",
              marginLeft: "-11.9rem",
              marginBottom: "-2.9rem",
            }}
          >
            {/* RESTORING <img> tag for GreyLoop_Logo.png */}
            <Image
              src="/GreyLoop_Logo.png"
              alt="GreyLoop logo"
              width={500}
              height={500}
              className="h-[14.5rem] w-auto mx-auto"
            />
          </div>

          {/* Message Area */}
          {message && (
            <div className="mt-4 mb-4 text-center text-sm font-medium text-gray-700">
              {message}
            </div>
          )}

          {/* Login Form with Logic */}
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="mb-5">
              <div className="relative">
                <input
                  type="email"
                  id="email-address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-3 px-4 pl-12 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                  placeholder="Email Address"
                />
                {/* Icon Wrapper (Email) */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 4v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-3 px-4 pl-12 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                  placeholder="Password"
                />
                {/* Icon Wrapper (Password) */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 11V7a2 2 0 114 0v4"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="mt-[-1.5rem] mb-6 text-center">
              <button
                type="button"
                // FIX: Use standard window location change for navigation
                onClick={() => (window.location.href = "/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition duration-150 ease-in-out"
              >
                Forget password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200 ease-in-out"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
