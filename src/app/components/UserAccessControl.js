"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  LayoutGrid,
  Loader2,
  Lock,
  CheckCircle,
  MinusCircle,
  XCircle,
  Users,
  Eye,
  Pencil,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const useSearchParams = () => {
  if (typeof window === "undefined") return new Map();
  return new URLSearchParams(window.location.search);
};

// --- Access Option Data ---
const ACCESS_OPTIONS = [
  {
    level: "Full Access",
    icon: CheckCircle,
    className:
      "bg-green-600 hover:bg-green-700 focus-visible:ring-green-300/70",
  },
  {
    level: "Partial Access",
    icon: MinusCircle,
    className:
      "bg-yellow-500 hover:bg-yellow-600 focus-visible:ring-yellow-300/70",
  },
  {
    level: "No Access",
    icon: XCircle,
    className: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-700/70",
  },
];

// --- NoDataState Component ---
const NoDataState = ({ text, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    <Icon className="w-10 h-10 mb-5" />
    <p className="text-xl font-medium">{text}</p>
  </div>
);

// --- MAIN COMPONENT ---
export default function UserAccessControl() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roleID = searchParams.get("roleID");
  const roleName = searchParams.get("roleName");
  const roleDescription = searchParams.get("roleDescription");
  const profileDisplay = roleDescription || roleName || "Guest User";

  const [accessForms, setAccessForms] = useState([]);
  const [usersInRole, setUsersInRole] = useState([]);
  const [activeTabName, setActiveTabName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(true);

  const [tabAccessLevels, setTabAccessLevels] = useState({});
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(
    ACCESS_OPTIONS[0].level
  );

  const [userAccess, setUserAccess] = useState({});
  const [rolePermissionAccess, setRolePermissionAccess] = useState({});
  const [profilePermissionAccess, setProfilePermissionAccess] = useState({});
  const [reportPermissionAccess, setReportPermissionAccess] = useState({});

  const [toast, setToast] = useState({ message: "", type: "" });

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 4000);
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      return null;
    }
  }

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);

    if (!payload || payload.exp < now) {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  // --- Fetch Access Forms ---
  useEffect(() => {
    async function fetchAccessControls() {
      try {
        const res = await fetch("/api/UserAccessControl");
        if (!res.ok) throw new Error("Failed to fetch access controls");
        const data = await res.json();
        setAccessForms(data);
        if (data.length > 0) setActiveTabName(data[0].name);
      } catch (error) {
        console.error("Error fetching access controls:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccessControls();
  }, []);

  // ✅ Reusable function to fetch data (so refresh can call it too)
  const fetchUsersByRole = useCallback(async () => {
    if (!roleID) return setUsersInRole([]);
    setLoadingUsers(true);

    try {
      const res = await fetch(
        `/api/UserAccessControl/UserByRoleAPI?roleID=${encodeURIComponent(
          roleID
        )}`
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();

      setUsersInRole(data);

      // ✅ Initialize Access States
      const initialAccess = {};
      const roleAccess = {};
      const profileAccess = {};
      const reportAccess = {};

      data.forEach((user) => {
        user.forms.forEach((form) => {
          const formName = form.formName;

          // Full Access
          if (form.fullAccess) {
            if (formName === "Roles")
              roleAccess[user.userId] = {
                view: true,
                edit: true,
                add: true,
                delete: true,
              };
            if (formName === "Profile")
              profileAccess[user.userId] = {
                view: true,
                edit: true,
                add: true,
                delete: true,
              };
            if (formName === "Report")
              reportAccess[user.userId] = {
                view: true,
                edit: true,
                add: true,
                delete: true,
              };
          }

          // Partial Access
          else if (form.partialAccess?.enabled) {
            const perms = form.partialAccess.permissions || {};
            const hasAllAccess = Object.values(perms).every(Boolean);

            if (formName === "Dashboard")
              initialAccess[user.userId] = hasAllAccess;
            if (formName === "Roles") roleAccess[user.userId] = { ...perms };
            if (formName === "Profile")
              profileAccess[user.userId] = { ...perms };
            if (formName === "Report") reportAccess[user.userId] = { ...perms };
          }

          // No Access
          else if (form.noAccess) {
            if (formName === "Dashboard") initialAccess[user.userId] = false;

            const noPerms = {
              view: false,
              edit: false,
              add: false,
              delete: false,
            };

            if (formName === "Roles") roleAccess[user.userId] = noPerms;
            if (formName === "Profile") profileAccess[user.userId] = noPerms;
            if (formName === "Report") reportAccess[user.userId] = noPerms;
          }
        });
      });

      // ✅ Apply states
      setUserAccess(initialAccess);
      setRolePermissionAccess(roleAccess);
      setProfilePermissionAccess(profileAccess);
      setReportPermissionAccess(reportAccess);

      // ✅ Determine Access Level for active tab (auto-select)
      if (activeTabName) {
        const selectedForm = data
          ?.flatMap((u) => u.forms || [])
          .find((f) => f.formName === activeTabName);

        let level = "No Access";
        if (selectedForm?.fullAccess) level = "Full Access";
        else if (selectedForm?.partialAccess?.enabled) level = "Partial Access";
        else if (selectedForm?.noAccess) level = "No Access";

        setSelectedAccessLevel(level);

        // ✅ Keep record in tabAccessLevels for consistency
        setTabAccessLevels((prev) => ({
          ...prev,
          [activeTabName]: level,
        }));
      }
    } catch (error) {
      console.error(error);
      setUsersInRole([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [roleID, activeTabName]);

  // ✅ Auto-fetch when roleID changes
  useEffect(() => {
    fetchUsersByRole();
  }, [fetchUsersByRole]);

  // ⬇️ Handle Tab Click Logic (Full / Partial / No Access Auto Select)
  const handleTabClick = (tabName) => {
    setActiveTabName(tabName);

    // ✅ Find the selected form by name (fixed: using .forms not .formAccess)
    const selectedForm = usersInRole
      ?.flatMap((u) => u.forms || [])
      .find((f) => f.formName === tabName);

    // ✅ Determine Access Level
    let level = "No Access";
    if (selectedForm?.fullAccess) level = "Full Access";
    else if (selectedForm?.partialAccess?.enabled) level = "Partial Access";
    else if (selectedForm?.noAccess) level = "No Access";

    setSelectedAccessLevel(level);

    // ✅ Remember each tab’s chosen access
    setTabAccessLevels((prev) => ({
      ...prev,
      [tabName]: level,
    }));
  };

  // --- Conditions ---
  const shouldShowCheck =
    activeTabName === "Dashboard" && selectedAccessLevel === "Full Access";
  const shouldShowRoleCheck =
    activeTabName === "Roles" && selectedAccessLevel === "Full Access";
  const shouldShowProfileCheck =
    activeTabName === "Profile" && selectedAccessLevel === "Full Access";
  const shouldShowReportCheck =
    activeTabName === "Report" && selectedAccessLevel === "Full Access";

  const shouldShowCheckboxes =
    activeTabName === "Dashboard" && selectedAccessLevel === "Partial Access";
  const shouldShowRolePermissions =
    activeTabName === "Roles" && selectedAccessLevel === "Partial Access";
  const shouldShowProfilePermissions =
    activeTabName === "Profile" && selectedAccessLevel === "Partial Access";
  const shouldShowReportPermissions =
    activeTabName === "Report" && selectedAccessLevel === "Partial Access";

  const shouldShowRedX =
    activeTabName === "Dashboard" && selectedAccessLevel === "No Access";
  const shouldShowRedX_Role =
    activeTabName === "Roles" && selectedAccessLevel === "No Access";
  const shouldShowRedX_Profile =
    activeTabName === "Profile" && selectedAccessLevel === "No Access";
  const shouldShowRedX_Report =
    activeTabName === "Report" && selectedAccessLevel === "No Access";

  const toggleCheckbox = (userId) => {
    setUserAccess((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleRolePermission = (userId, permission) => {
    setRolePermissionAccess((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: !prev[userId][permission],
      },
    }));
  };

  const toggleProfilePermission = (userId, permission) => {
    setProfilePermissionAccess((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: !prev[userId][permission],
      },
    }));
  };

  const toggleReportPermission = (userId, permission) => {
    setReportPermissionAccess((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: !prev[userId][permission],
      },
    }));
  };

  // --- Render User Access ---
  const renderUserAccess = (user) => {
    if (shouldShowRedX) return <XCircle className="w-5 h-5 text-red-500" />;

    if (shouldShowRedX_Role)
      return <XCircle className="w-5 h-5 text-red-500" />;
    if (shouldShowRedX_Profile)
      return <XCircle className="w-5 h-5 text-red-500" />;
    if (shouldShowRedX_Report)
      return <XCircle className="w-5 h-5 text-red-500" />;
    if (shouldShowCheck)
      return <CheckCircle className="w-5 h-5 text-green-500" />;

    if (shouldShowCheckboxes)
      return (
        <input
          type="checkbox"
          checked={userAccess[user.userId] || false}
          onChange={() => toggleCheckbox(user.userId)}
          className="w-5 h-5 accent-indigo-600 cursor-pointer"
        />
      );

    if (shouldShowRoleCheck)
      return <CheckCircle className="w-5 h-5 text-green-500" />;

    if (shouldShowProfileCheck)
      return <CheckCircle className="w-5 h-5 text-green-500" />;

    if (shouldShowReportCheck)
      return <CheckCircle className="w-5 h-5 text-green-500" />;

    // ✅ Roles + Partial Access (Modern Master Design)
    if (shouldShowRolePermissions) {
      const perms = rolePermissionAccess[user.userId] || {};

      // Define the permissions
      const permissionsData = [
        { key: "view", Icon: Eye, color: "text-blue-500", label: "View" },
        { key: "edit", Icon: Pencil, color: "text-yellow-600", label: "Edit" },
        { key: "add", Icon: Plus, color: "text-green-600", label: "Add" },
        { key: "delete", Icon: Trash2, color: "text-red-600", label: "Delete" },
      ];

      return (
        // Minimalist Container: No background, no border. Focus on a tight row (px-4 py-2)
        <div className="flex items-center gap-2 p-2">
          {permissionsData.map(({ key, Icon, color, label }) => {
            const isActive = perms[key] || false;

            return (
              <button
                key={key}
                onClick={() => toggleRolePermission(user.userId, key)}
                title={`${label} permission`}
                // Master Design Toggle Styling:
                className={`
              p-2 rounded-lg transition-all duration-150 ease-in-out
              ${
                isActive
                  ? // Active State: Solid background, white icon for high contrast
                    `bg-indigo-600 shadow-md text-white`
                  : // Inactive State: Subtle background, muted icon
                    `bg-gray-100 hover:bg-gray-200 text-gray-500`
              }
              flex items-center justify-center w-8 h-8 flex-shrink-0
            `}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      );
    }

    // ✅ Profile + Partial Access (Modern Master Design)
    if (shouldShowProfilePermissions) {
      const perms = profilePermissionAccess[user.userId] || {};

      // Define the permissions
      const permissionsData = [
        { key: "view", Icon: Eye, color: "text-blue-500", label: "View" },
        { key: "edit", Icon: Pencil, color: "text-yellow-600", label: "Edit" },
        { key: "add", Icon: Plus, color: "text-green-600", label: "Add" },
        { key: "delete", Icon: Trash2, color: "text-red-600", label: "Delete" },
      ];

      return (
        // Minimalist Container: No background, no border. Focus on a tight row (px-4 py-2)
        <div className="flex items-center gap-2 p-2">
          {permissionsData.map(({ key, Icon, color, label }) => {
            const isActive = perms[key] || false;

            return (
              <button
                key={key}
                onClick={() => toggleProfilePermission(user.userId, key)}
                title={`${label} permission`}
                // Master Design Toggle Styling:
                className={`
              p-2 rounded-lg transition-all duration-150 ease-in-out
              ${
                isActive
                  ? // Active State: Solid background, white icon for high contrast
                    `bg-indigo-600 shadow-md text-white`
                  : // Inactive State: Subtle background, muted icon
                    `bg-gray-100 hover:bg-gray-200 text-gray-500`
              }
              flex items-center justify-center w-8 h-8 flex-shrink-0
            `}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      );
    }

    // ✅ Report + Partial Access (Modern Master Design)
    if (shouldShowReportPermissions) {
      const perms = reportPermissionAccess[user.userId] || {};

      // Define the permissions
      const permissionsData = [
        { key: "view", Icon: Eye, color: "text-blue-500", label: "View" },
        { key: "edit", Icon: Pencil, color: "text-yellow-600", label: "Edit" },
        { key: "add", Icon: Plus, color: "text-green-600", label: "Add" },
        { key: "delete", Icon: Trash2, color: "text-red-600", label: "Delete" },
      ];

      return (
        // Minimalist Container: No background, no border. Focus on a tight row (px-4 py-2)
        <div className="flex items-center gap-2 p-2">
          {permissionsData.map(({ key, Icon, color, label }) => {
            const isActive = perms[key] || false;

            return (
              <button
                key={key}
                onClick={() => toggleReportPermission(user.userId, key)}
                title={`${label} permission`}
                // Master Design Toggle Styling:
                className={`
              p-2 rounded-lg transition-all duration-150 ease-in-out
              ${
                isActive
                  ? // Active State: Solid background, white icon for high contrast
                    `bg-indigo-600 shadow-md text-white`
                  : // Inactive State: Subtle background, muted icon
                    `bg-gray-100 hover:bg-gray-200 text-gray-500`
              }
              flex items-center justify-center w-8 h-8 flex-shrink-0
            `}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const handleUpdateAccess = async (userId) => {
    try {
      const activeForm = accessForms.find((f) => f.name === activeTabName);
      const formId = activeForm?._id;
      const userIds = userId;

      let accessMap = {};
      if (activeTabName === "Dashboard") accessMap = userAccess;
      else if (activeTabName === "Roles") accessMap = rolePermissionAccess;
      else if (activeTabName === "Profile") accessMap = profilePermissionAccess;
      else if (activeTabName === "Report") accessMap = reportPermissionAccess;

      const userAccessValue = accessMap[userId];
      console.log("🔍 Sending userAccess:", userAccessValue);

      const res = await fetch("/api/UserAccessControl/updatesingleaccess", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          userIds,
          selectedAccessLevel: "Partial Access",
          userAccessValue,
        }),
      });

      const data = await res.json();
      console.log("✅ API Response:", data);

      if (res.ok) showToast("✅ Access levels updated successfully", "success");
      else showToast(`❌ ${data.message}`, "error");
    } catch (error) {
      console.error("⚠️ Error:", error);
      showToast("⚠️ Something went wrong", "error");
    }
  };

  const handleUpdateAllAccess = async () => {
    try {
      const activeForm = accessForms.find((f) => f.name === activeTabName);
      const formId = activeForm?._id;
      const userIds = usersInRole.map((u) => u._id || u.userId);

      const res = await fetch("/api/UserAccessControl/updatefullaccess", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          userIds,
          selectedAccessLevel,
        }),
      });

      const data = await res.json();
      console.log("✅ Response:", data);

      if (res.ok) {
        showToast("✅ Access levels updated successfully", "success");
      } else {
        showToast("❌ Failed to update access levels", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("⚠️ Something went wrong", "error");
    }
  };

  return (
    <>
      {/* 🌟 Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg border text-sm font-medium backdrop-blur-md 
        transition-all duration-700 transform animate-slide-in 
        ${
          toast.type === "success"
            ? "bg-green-50 border-green-300 text-green-800"
            : toast.type === "error"
            ? "bg-red-50 border-red-300 text-red-800"
            : "bg-yellow-50 border-yellow-300 text-yellow-800"
        }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {toast.type === "error" && (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-gray-100 p-4 sm:p-6 md:p-10 font-sans">
        <div className="w-full max-w-4xl mt-2">
          {/* Header */}
          <header className="flex justify-center mb-6">
            <div className="flex items-center space-x-3 px-6 py-3 bg-white/90 backdrop-blur-lg border border-indigo-200 rounded-full shadow-lg hover:shadow-indigo-300/50 transition">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span className="text-base sm:text-lg font-semibold text-gray-800">
                Access Profile:{" "}
                <span className="text-indigo-700 font-bold">
                  {profileDisplay}
                </span>
              </span>

              {/* 🔄 Refresh Button */}
              <button
                onClick={fetchUsersByRole}
                disabled={loadingUsers}
                className={`ml-3 group relative flex items-center justify-center gap-2 px-4 py-2 
    rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 
    hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 
    transition-all duration-500 shadow-lg hover:shadow-xl overflow-hidden
    ${loadingUsers ? "opacity-70 cursor-wait" : "opacity-100"}`}
                title="Refresh Data"
              >
                {/* ✨ Animated glow */}
                <div className="absolute inset-0 rounded-full bg-white/10 blur-md animate-pulse" />

                {/* 🔄 Icon */}
                <Loader2
                  className={`relative z-10 w-5 h-5 text-white transition-transform duration-500 
      ${loadingUsers ? "animate-spin-slow" : "group-hover:rotate-180"}`}
                />

                {/* 💬 Text Label */}
                <span
                  className={`relative z-10 text-white text-sm font-medium 
      transition-all duration-500 ease-in-out 
      ${
        loadingUsers ? "opacity-0 w-0" : "opacity-100 group-hover:translate-x-1"
      }`}
                >
                  {loadingUsers ? "" : "Refresh"}
                </span>
              </button>
            </div>
          </header>

          {/* Main Card */}
          <div className="bg-white/95 rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
            {loading ? (
              <NoDataState
                text="Loading access modules..."
                icon={({ className }) => (
                  <Loader2 className={`animate-spin ${className}`} />
                )}
              />
            ) : accessForms.length === 0 ? (
              <NoDataState
                text="No active access control modules found."
                icon={LayoutGrid}
              />
            ) : (
              <>
                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-8 border-b pb-4 border-gray-100">
                  {accessForms.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => handleTabClick(item.name)} // ✅ Call the function here
                      className={`relative px-5 py-2 text-sm sm:text-base rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 
        ${
          activeTabName === item.name
            ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-md transform scale-[1.03]"
            : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
        }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>

                {/* Access Selector */}
                <div className="space-y-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ACCESS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = selectedAccessLevel === option.level;

                      return (
                        <button
                          key={option.level}
                          onClick={() => {
                            setSelectedAccessLevel(option.level);
                            setTabAccessLevels((prev) => ({
                              ...prev,
                              [activeTabName]: option.level, // remember this tab’s chosen level
                            }));
                          }}
                          className={`relative p-3 rounded-xl border-2 text-center transition-all duration-300 shadow-md 
                          ${
                            isActive
                              ? `border-indigo-400 ${option.className} text-white transform scale-[1.03]`
                              : "bg-white border-gray-200 text-gray-800 hover:bg-indigo-50"
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-extrabold leading-tight">
                              {option.level}
                            </span>
                          </div>

                          {isActive && (
                            <div className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md">
                              <CheckCircle className="w-3 h-3 text-indigo-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Users Section */}
                <div className="w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition">
                  <button
                    onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
                    className="w-full flex justify-between items-center px-5 py-3 bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                        Users Assigned{" "}
                        <span className="text-indigo-500">
                          ({usersInRole.length})
                        </span>
                      </h2>
                    </div>

                    {isUsersCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isUsersCollapsed
                        ? "max-h-0 opacity-0"
                        : "max-h-[450px] opacity-100"
                    }`}
                  >
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-4 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          <span className="text-sm">Fetching users...</span>
                        </div>
                      ) : usersInRole.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-3 italic">
                          No users found for{" "}
                          <span className="font-medium text-gray-700">
                            {profileDisplay}
                          </span>
                          .
                        </p>
                      ) : (
                        <>
                          <ul className="space-y-2">
                            {usersInRole.map((user) => (
                              <li
                                key={user.userId}
                                className="flex justify-between items-center px-4 py-2 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all"
                              >
                                {/* 👤 User Info */}
                                <div className="flex items-center gap-3">
                                  <span className="font-sans text-lg font-semibold text-gray-700 tracking-tight">
                                    {user.userName}
                                  </span>
                                </div>

                                {/* 🔒 Access Controls + Update button only for Partial Access */}
                                <div className="flex items-center gap-4">
                                  {renderUserAccess(user)}
                                  {selectedAccessLevel === "Partial Access" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateAccess(user.userId)
                                      }
                                      className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition duration-200 transform hover:scale-[1.02] active:scale-[0.97]"
                                    >
                                      Update
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>

                          {/* 🔽 Single Update Button for Full or No Access */}
                          {(selectedAccessLevel === "Full Access" ||
                            selectedAccessLevel === "No Access") && (
                            <div className="flex justify-center mt-6">
                              <button
                                onClick={handleUpdateAllAccess}
                                className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition duration-200 transform hover:scale-[1.03] active:scale-[0.97]"
                              >
                                Update
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
