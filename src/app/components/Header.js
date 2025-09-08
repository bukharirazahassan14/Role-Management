"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export default function Header({ title = "Dashboard Overview", userName = "Super Admin" }) {
  const [open, setOpen] = useState(false);
  const [storedName, setStoredName] = useState(userName); // ✅ state for userName
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("loginID"); 
    localStorage.removeItem("userName");
    localStorage.removeItem("token"); 
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-10 mb-8 bg-white shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Page Title */}
        <h2 className="text-2xl font-semibold text-gray-800 capitalize">{title}</h2>

        {/* User Section */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            <Image
              src="/avatar.png"
              alt="User Avatar"
              width={40}
              height={40}
              className="border shadow-sm"
            />
            <span className="text-lg font-semibold text-gray-700">
              {storedName}
            </span>
          </div>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border">
              <button
                 className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export User
              </button>
              <button
                 className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Import User
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
            
          )}
        </div>
      </div>
    </header>
  );
}
