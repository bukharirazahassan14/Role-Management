"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  User,
  CheckCircle2,
  FileBarChart2,
  UserCog,
  UserPlus2,
  Briefcase,
  Plus,
  X,
  Save,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

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
  } catch {
    return null;
  }
}

export default function Roles() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const payload = parseJwt(token);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
      router.push("/login");
    }
  }, [router]);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const colorClasses = {
    indigo: {
      bg: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
      text: "text-gray-900 group-hover:text-indigo-600",
      border: "hover:border-indigo-300",
      footerBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
      footerIcon: "text-indigo-600",
      glow: "bg-gradient-to-r from-indigo-500 to-pink-500",
    },
    emerald: {
      bg: "bg-gradient-to-r from-emerald-500 to-lime-500",
      text: "text-emerald-700 group-hover:text-emerald-800",
      border: "hover:border-emerald-400",
      footerBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      footerIcon: "text-emerald-600",
      glow: "bg-gradient-to-r from-emerald-400 to-lime-400",
    },
    blue: {
      bg: "bg-gradient-to-r from-blue-500 to-cyan-400",
      text: "text-gray-900 group-hover:text-blue-600",
      border: "hover:border-blue-300",
      footerBg: "bg-blue-50 border-blue-200 text-blue-700",
      footerIcon: "text-blue-600",
      glow: "bg-gradient-to-r from-blue-500 to-cyan-400",
    },
  };

  const iconMap = {
    "Super Admin": Users,
    Management: UserCheck,
    HR: UserPlus,
    Staff: User,
    "Temp Staff": UserMinus,
  };

  const footerIconMap = {
    "Super Admin": CheckCircle2,
    Management: FileBarChart2,
    HR: UserPlus2,
    Staff: Briefcase,
    "Temp Staff": UserCog,
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (viewingRole) return;

    if (!newRole.name.trim() || !newRole.description.trim()) {
      showToast("Please fill all fields", "error");
      return;
    }

    const duplicate = roles.find(
      (r) =>
        r.name.toLowerCase() === newRole.name.trim().toLowerCase() &&
        (!editingRole || r._id !== editingRole._id)
    );
    if (duplicate) {
      showToast("Role name must be unique", "error");
      return;
    }

    const isUpdate = !!editingRole;
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `/api/roles/${editingRole._id}` : "/api/roles";

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save role", "error");
        return;
      }

      showToast(`Role ${isUpdate ? "updated" : "created"} successfully`, "success");
      await fetchRoles();
      handleCloseCard();
    } catch (err) {
      console.error("Error saving role:", err);
      showToast("Error saving role", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Failed to delete role", "error");
        return;
      }
      showToast("Role removed successfully", "success");
      await fetchRoles();
    } catch (err) {
      console.error(err);
      showToast("Error deleting role", "error");
    }
  };

  const handleEdit = (role) => {
    setNewRole({ name: role.name, description: role.description });
    setEditingRole(role);
    setViewingRole(null);
    setShowAddCard(true);
  };

  const handleView = (role) => {
    setNewRole({ name: role.name, description: role.description });
    setViewingRole(role);
    setEditingRole(null);
    setShowAddCard(true);
  };

  const handleAddNewClick = () => {
    setNewRole({ name: "", description: "" });
    setEditingRole(null);
    setViewingRole(null);
    setShowAddCard(true);
  };

  const handleCloseCard = () => {
    setNewRole({ name: "", description: "" });
    setEditingRole(null);
    setViewingRole(null);
    setShowAddCard(false);
  };

  const isReadOnly = !!viewingRole;
  const cardTitle = viewingRole
    ? "View Role Details"
    : editingRole
    ? "Edit Role"
    : "Create Role";

  return (
    <div className="p-8 relative">
      {toast.message && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-500 ease-out transform ${
            toast.type === "success"
              ? "bg-gradient-to-r from-emerald-500 to-lime-500 translate-y-0 opacity-100"
              : "bg-gradient-to-r from-rose-500 to-pink-600 translate-y-0 opacity-100"
          } animate-slide-down`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role, i) => {
          const colorKeys = Object.keys(colorClasses);
          const style = colorClasses[colorKeys[i % colorKeys.length]];
          const Icon = iconMap[role.name] || User;
          const FooterIcon = footerIconMap[role.name] || CheckCircle2;

          const handleClick = () => {
            const query = new URLSearchParams({
              roleID: role._id,
              roleName: role.name,
              roleDescription: role.description,
            }).toString();
            router.push(`/main/UserAccessControl?${query}`);
          };

          const isSuperAdmin = role.name === "Super Admin";

          return (
            <div
              key={role._id}
              onClick={handleClick}
              className={`group relative flex flex-col items-center justify-between rounded-2xl p-8 cursor-pointer bg-white/70 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${style.border}`}
            >
              {/* ✅ Disable icons if Super Admin */}
              <div className="absolute top-3 right-3 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Eye
                  title="View"
                  className={`w-5 h-5 ${
                    isSuperAdmin
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-500 hover:text-blue-700 cursor-pointer"
                  }`}
                  onClick={
                    isSuperAdmin
                      ? (e) => e.stopPropagation()
                      : (e) => {
                          e.stopPropagation();
                          handleView(role);
                        }
                  }
                />
                <Pencil
                  title="Edit"
                  className={`w-5 h-5 ${
                    isSuperAdmin
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-yellow-500 hover:text-yellow-700 cursor-pointer"
                  }`}
                  onClick={
                    isSuperAdmin
                      ? (e) => e.stopPropagation()
                      : (e) => {
                          e.stopPropagation();
                          handleEdit(role);
                        }
                  }
                />
                <Trash2
                  title="Delete"
                  className={`w-5 h-5 ${
                    isSuperAdmin
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-500 hover:text-red-700 cursor-pointer"
                  }`}
                  onClick={
                    isSuperAdmin
                      ? (e) => e.stopPropagation()
                      : (e) => {
                          e.stopPropagation();
                          handleDelete(role._id);
                        }
                  }
                />
              </div>

              <div
                className={`absolute -top-6 flex items-center justify-center h-16 w-16 rounded-full shadow-md ${style.bg} group-hover:scale-110 transition-transform duration-300`}
              >
                <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Icon className={`h-7 w-7 ${style.footerIcon}`} />
                </div>
              </div>

              <div className="mt-12 text-center">
                <h3 className={`text-xl font-semibold mb-2 ${style.text}`}>
                  {role.description}
                </h3>
              </div>

              <div
                className={`mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${style.footerBg}`}
              >
                <FooterIcon className={`w-5 h-5 ${style.footerIcon}`} />
                Access Control
              </div>

              <div
                className={`absolute inset-x-0 bottom-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${style.glow}`}
              />
            </div>
          );
        })}
      </div>

      <div className="group fixed bottom-8 right-8 z-50">
        <button
          onClick={handleAddNewClick}
          className="h-16 w-16 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-300 hover:shadow-xl hover:scale-110 transition-all duration-300 ease-out relative after:absolute after:inset-0 after:rounded-full after:animate-ping after:bg-indigo-400/20"
        >
          <Plus className="w-7 h-7" />
        </button>
        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Create Role
        </span>
      </div>

      {showAddCard && (
        <div className="fixed bottom-28 right-10 bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/30 w-80 z-50 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{cardTitle}</h3>
            <button
              onClick={handleCloseCard}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Enter role name"
                className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none ${
                  isReadOnly ? "bg-gray-100" : "focus:ring-indigo-400"
                }`}
                disabled={isReadOnly || !!editingRole}
              />
              {!!editingRole && !isReadOnly && (
                <p className="text-xs text-red-500 mt-1">
                  Role name cannot be changed.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Label</label>
              <input
                type="text"
                value={newRole.description}
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
                placeholder="Enter visible name"
                className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none ${
                  isReadOnly ? "bg-gray-100" : "focus:ring-pink-400"
                }`}
                disabled={isReadOnly}
              />
            </div>

            {!isReadOnly ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Saving...</span>
                ) : (
                  <>
                    <Save className="w-5 h-5" />{" "}
                    {editingRole ? "Update" : "Save"}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCloseCard}
                className="w-full py-2.5 mt-2 rounded-lg text-white font-medium bg-gray-500 hover:bg-gray-600 shadow-md transition-all duration-300 flex items-center justify-center gap-2"
              >
                Close
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
