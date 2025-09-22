"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export default function Header({
  title = "Dashboard Overview",
  userName = "Super Admin",
}) {
  const [open, setOpen] = useState(false);
  const [storedName, setStoredName] = useState(userName);
  const menuRef = useRef(null);

  // Load userName from localStorage on mount
  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setStoredName(name);
  }, []);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("loginID");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-10 mb-8 bg-white shadow-md border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center gap-2">
          {/* Blue Dot Accent */}
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>

        {/* Right - User */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setOpen(!open)}
          >
            <div className="relative">
              <Image
                src="/avatar.png"
                alt="User Avatar"
                width={40}
                height={40}
                className="border rounded-full shadow-sm"
              />
              {/* Blue Status Dot */}
              <span className="absolute bottom-0 right-0 block w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
            </div>
            <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition">
              {storedName}
            </span>
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-lg border overflow-hidden">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
                📤 Export User
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
