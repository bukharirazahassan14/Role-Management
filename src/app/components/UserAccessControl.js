"use client";

import React, { useEffect, useState, useMemo } from "react";
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

  const activeTab = useMemo(
    () => accessForms.find((item) => item.name === activeTabName),
    [accessForms, activeTabName]
  );

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

  // --- Fetch Users By Role ---
  useEffect(() => {
    async function fetchUsersByRole() {
      if (!roleName) return setUsersInRole([]);
      setLoadingUsers(true);
      try {
        const res = await fetch(
          `/api/UserAccessControl/UserByRoleAPI?roleName=${encodeURIComponent(
            roleName
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        
        setUsersInRole(data);

        const initialAccess = {};
        const roleAccess = {};
        data.forEach((u) => {
          initialAccess[u.id] = true;
          roleAccess[u.id] = {
            view: true,
            edit: false,
            add: false,
            delete: false,
          };
        });
        setUserAccess(initialAccess);
        setRolePermissionAccess(roleAccess);
        setProfilePermissionAccess(roleAccess);
        setReportPermissionAccess(roleAccess);
      } catch (error) {
        console.error(error);
        setUsersInRole([]);
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsersByRole();
  }, [roleName]);

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

  const toggleCheckbox = (id) => {
    setUserAccess((prev) => ({ ...prev, [id]: !prev[id] }));
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
    if (shouldShowRedX) 
       return <XCircle className="w-5 h-5 text-red-500" />;
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
          checked={userAccess[user.id] || false}
          onChange={() => toggleCheckbox(user.id)}
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
      const perms = rolePermissionAccess[user.id] || {};

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
                onClick={() => toggleRolePermission(user.id, key)}
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
      const perms = profilePermissionAccess[user.id] || {};

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
                onClick={() => toggleProfilePermission(user.id, key)}
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
      const perms = reportPermissionAccess[user.id] || {};

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
                onClick={() => toggleReportPermission(user.id, key)}
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
      console.log("Updating access for user:", userId);
      // You can integrate your PUT /api/UserAccessControl logic here
      // Example:
      // await fetch(`/api/UserAccessControl/${userId}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ permissions: ... }),
      // });
    } catch (error) {
      console.error("Failed to update access:", error);
    }
  };

  return (
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
                    onClick={() => {
                      setActiveTabName(item.name);
                      // restore previously selected access for this tab (default = Full Access)
                      setSelectedAccessLevel(
                        tabAccessLevels[item.name] || ACCESS_OPTIONS[0].level
                      );
                    }}
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
                      <ul className="space-y-2">
                        {usersInRole.map((user) => (
                          <li
                            key={user.id}
                            className="flex justify-between items-center px-4 py-2 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all"
                          >
                            {/* 👤 User Info */}
                            <div className="flex items-center gap-3">
                              <span className="font-sans text-lg font-semibold text-gray-700 tracking-tight">
                                {user.fullName}
                              </span>
                            </div>

                            {/* 🔒 Access Controls */}
                            <div className="flex items-center gap-4">
                              {renderUserAccess(user)}

                              {/* 🆕 Individual Update Button */}
                              <button
                                onClick={() => handleUpdateAccess(user.id)}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition duration-200 transform hover:scale-[1.02] active:scale-[0.97]"
                              >
                                Update
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
