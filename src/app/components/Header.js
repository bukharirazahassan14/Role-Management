"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

// Define the default profile image path
const DEFAULT_AVATAR = "/avatar.png";

export default function Header({ title = "Dashboard Overview", userName = "Super Admin" }) {
  const [open, setOpen] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [storedName, setStoredName] = useState(userName);
  // Set initial state to the default avatar, will be updated in useEffect
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);

  const menuRef = useRef(null);
  const cardRef = useRef(null);

  // --- NEW: Error handler function for Next.js Image component ---
  const handleImageError = () => {
    // This is called if the image fails to load (e.g., 404 Not Found)
    setProfileImage(DEFAULT_AVATAR);
  };
  // -------------------------------------------------------------

  // Load stored name and check for existing profile image on mount
  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setStoredName(name);

    // Check for loginID to set the initial profile image path
    const userId = localStorage.getItem("loginID");
    if (userId) {
      // Construct the expected path: /uploads/profiles/{userId}.png
      // Use cache-buster to prevent showing a broken image from old browser cache
      const customPath = `/uploads/profiles/${userId}.png?v=${Date.now()}`;
      setProfileImage(customPath);
    } else {
      setProfileImage(DEFAULT_AVATAR);
    }
  }, []);

  // Handle click outside for dropdown and card
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        cardRef.current &&
        !cardRef.current.contains(event.target)
      ) {
        setOpen(false);
        setShowCard(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("loginID");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  /**
   * Helper: createImage from dataURL
   */
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

  /**
   * New handleImageUpload:
   */
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target.result;
          const img = await createImage(dataUrl);

          // Create canvas of 200x200
          const canvasSize = 200;
          const canvas = document.createElement("canvas");
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          const ctx = canvas.getContext("2d");

          // Calculate center-crop source rectangle
          const { width: iw, height: ih } = img;
          const destSize = canvasSize;

          let sx = 0, sy = 0, sWidth = iw, sHeight = ih;

          if (iw > ih) {
            // landscape: crop width (center crop horizontally)
            sWidth = ih;
            sx = (iw - ih) / 2;
            sy = 0;
          } else if (ih > iw) {
            // portrait: crop height (TOP CROP)
            sHeight = iw;
            sy = 0; // START CROP FROM THE VERY TOP (y=0)
            sx = 0;
          } // if equal, use full image

          // Draw cropped image to canvas sized 200x200
          ctx.clearRect(0, 0, destSize, destSize);
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destSize, destSize);

          // Convert canvas to blob (png)
          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error("Failed to convert canvas to blob");
              return;
            }

            // Prepare FormData with userId from localStorage.loginID
            const userId = localStorage.getItem("loginID");
            if (!userId) {
              alert("User not logged in (missing loginID).");
              return;
            }

            const formData = new FormData();
            formData.append("file", blob, `${userId}.png`);
            formData.append("userId", userId);

            // Upload to server
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const errText = await res.text().catch(() => "");
              console.error("Upload failed", errText);
              alert("Upload failed");
              return;
            }

            const data = await res.json();
            if (data?.filePath) {
              // Add a cache-busting timestamp to the URL to force reload
              const newPathWithBuster = `${data.filePath}?v=${Date.now()}`;
              setProfileImage(newPathWithBuster);
            }
          }, "image/png");
        } catch (innerErr) {
          console.error("Image process error", innerErr);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("handleImageUpload error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-10 mb-8 bg-white shadow-md border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>

        {/* Right - User */}
        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-3 group">
            
             {/* Only name toggles dropdown */}
            <span
              onClick={() => setOpen(!open)}
              className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition cursor-pointer"
            >
              {storedName}
            </span>
            
            {/* Image opens profile card */}
            <div
              className="relative cursor-pointer transform transition-transform duration-300 hover:scale-110"
              onClick={() => setShowCard(!showCard)}
            >
              <Image
                src={profileImage}
                alt="User Avatar"
                width={45}
                height={45}
                className="border rounded-full shadow-sm object-cover object-top"
                key={profileImage} // Key helps force Next.js Image component to re-render
                onError={handleImageError} // <-- NEW FALLBACK LOGIC
              />
              <span className="absolute bottom-0 right-0 block w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
            </div>

           
          </div>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-lg border overflow-hidden">
            {/*   <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
                📤 Export User
              </button> */}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                🚪 Sign Out
              </button>
            </div>
          )}

          {/* Modern Profile Card */}
          {showCard && (
            <div
              ref={cardRef}
              className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <Image
                  src={profileImage}
                  alt="Profile Preview"
                  width={100}
                  height={100}
                  className="rounded-full border shadow-sm object-cover object-top transition-transform duration-300 hover:scale-105"
                  key={profileImage + '_card'} // Key helps force re-render
                  onError={handleImageError} // <-- NEW FALLBACK LOGIC
                />
                <h3 className="mt-3 text-lg font-semibold text-gray-800">
                  {storedName}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Upload a new profile photo
                </p>

                <label className="cursor-pointer bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}