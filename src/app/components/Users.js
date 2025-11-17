"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  Glasses,
  Plus,
  X,
  FileText,
  Upload,
  Trash2,
  Edit,
  List,
  LayoutGrid,
  UserCircle2,
  Mail,
  Calendar,
  Check,
} from "lucide-react"; // icons

import useIsMobile from "../hooks/useIsMobile"; // adjust path if needed

const Image = ({ src, alt, width, height, className, onError }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    className={className}
    onError={onError}
    style={{ objectFit: "cover" }}
  />
);
// -------------------------------------------

// --- Image Helpers (Required Constants and Functions) ---
const DEFAULT_AVATAR = "/avatar.png";

const getUserImagePath = (userId) => {
  return `/uploads/profiles/${userId}.png`;
};

const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = DEFAULT_AVATAR;
};

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fileFrameUser, setFileFrameUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const didFetch = useRef(false); // ✅ prevents duplicate API calls
  const [searchQuery, setSearchQuery] = useState("");

  // Form state for uploading
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [fileCounts, setFileCounts] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8; // change number of rows per page

  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    primaryEmail: "",
    secondaryEmail: "",
    fatherName: "",
    phone: "",
    emergencyContact: "",
    emergencyRelation: "",
    cnic: "",
    role: "",
    medicalCondition: "",
    jd: "",
    exp: "",
    accHolderName: "",
    accNumber: "",
    bankName: "",
    iban: "",
    password: "",
    isActive: true,
  });

  const [viewMode, setViewMode] = useState("list"); // "list" | "card"
  const isMobile = useIsMobile();

  const [permissions, setPermissions] = useState({
    view: false,
    edit: false,
    add: false,
    delete: false,
  });

  // ✅ Fetch and set permissions from userAccess
  useEffect(() => {
    const accessData = JSON.parse(localStorage.getItem("userAccess") || "{}");
    const formAccess = accessData.formAccess || [];

    const activeFormId = localStorage.getItem("activeForm");

    if (!activeFormId || formAccess.length === 0) {
      console.warn("⚠️ No form access data found for this user.");
      return;
    }

    const currentForm = formAccess.find(
      (f) => String(f.formId) === String(activeFormId)
    );

    if (currentForm) {
      if (currentForm.fullAccess) {
        setPermissions({
          view: true,
          edit: true,
          add: true,
          delete: true,
        });
      } else if (currentForm.partialAccess?.enabled) {
        const perms = currentForm.partialAccess.permissions || {};
        setPermissions({
          view: perms.view || false,
          edit: perms.edit || false,
          add: perms.add || false,
          delete: perms.delete || false,
        });
      } else {
        setPermissions({
          view: false,
          edit: false,
          add: false,
          delete: false,
        });
      }
    } else {
      console.warn("⚠️ No matching form access found.");
    }
  }, []);

  // Example usage
  const canView = permissions.view;
  const canEdit = permissions.edit;
  const canAdd = permissions.add;
  const canDelete = permissions.delete;

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

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    // If Staff or Temp Staff → force card view
    if (role === "Staff" || role === "Temp Staff" || role === "Team") {
      setViewMode("card");
    }
  }, []);

  // ✅ Token validation on component mount
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

  useEffect(() => {
    if (selectedUser) {
      setUserFormData({
        id: selectedUser.id || selectedUser._id || "",
        firstName: selectedUser.firstName || "",
        lastName: selectedUser.lastName || "",
        primaryEmail: selectedUser.primaryEmail || "",
        secondaryEmail: selectedUser.secondaryEmail || "",
        fatherName: selectedUser.fatherName || "",
        phone: selectedUser.phone || "",
        emergencyContact: selectedUser.emergencyContact || "",
        emergencyRelation: selectedUser.emergencyRelation || "",
        cnic: selectedUser.cnic || "",
        role: selectedUser.role?._id || "", // ✅ only store _id, not whole object
        medicalCondition: selectedUser.medicalCondition || "",
        jd: selectedUser.jd || "",
        exp: selectedUser.exp || "",
        accHolderName: selectedUser.accHolderName || "",
        accNumber: selectedUser.accNumber || "",
        bankName: selectedUser.bankName || "",
        iban: selectedUser.iban || "",
        password: "", // never prefill passwords
        isActive: selectedUser.isActive ?? true,
      });
    }
  }, [selectedUser]);

  // 🔹 Open file frame & fetch attached files
  const handleOpenFrame = async (user) => {
    try {
      const res = await fetch(`/api/files?userId=${user.id}`);
      const files = await res.json();
      setFileFrameUser({ ...user, files: files || [] });
    } catch (err) {
      console.error("Error fetching files:", err);
      setFileFrameUser({ ...user, files: [] });
    }
    setNewTitle("");
    setNewDescription("");
    setNewFile(null);
  };

  const handleUpload = async () => {
    if (!newFile) return alert("⚠️ Please select a file!");
    if (!newTitle || newTitle.trim() === "")
      return alert("⚠️ Please enter a valid Title!");
    if (!newDescription || newDescription.trim() === "")
      return alert("⚠️ Please enter a valid Description!");

    // 🔹 fetch logged-in userId from localStorage
    const loginID = localStorage.getItem("loginID");
    if (!loginID) return alert("User not logged in!");

    const formData = new FormData();
    formData.append(
      "title",
      newTitle || `File ${fileFrameUser.files?.length + 1 || 1}`
    );
    formData.append("description", newDescription);
    formData.append("file", newFile);
    formData.append("createdBy", loginID);
    formData.append("userId", fileFrameUser.id);

    const res = await fetch("/api/files", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const savedFile = await res.json();

      setFileFrameUser((prev) => ({
        ...prev,
        files: [savedFile, ...(prev.files || [])],
      }));

      setNewTitle("");
      setNewDescription("");
      setNewFile(null);
      // 🔹 refresh count
      fetchFileCount(fileFrameUser.id);
    } else {
      alert("Upload failed");
    }
  };

  // 🔹 fetch file count for one user
  const fetchFileCount = async (userId) => {
    try {
      const res = await fetch(`/api/files/count/${userId}`);
      const data = await res.json();
      setFileCounts((prev) => ({ ...prev, [userId]: data.count }));
    } catch (err) {
      console.error("Failed to fetch file count", err);
    }
  };

  // 🛠️ Example handler for deleting a file
  const handleDeleteFile = async (fileToDelete) => {
    if (!fileToDelete._id) {
      alert("Cannot delete file without ID");
      return;
    }

    const res = await fetch(`/api/files/${fileToDelete._id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setFileFrameUser((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f._id !== fileToDelete._id),
      }));
      // 🔹 refresh count
      fetchFileCount(fileFrameUser.id);
    } else {
      alert("Delete failed");
    }
  };

  useEffect(() => {
    if (didFetch.current) return; // ✅ avoid duplicate calls
    didFetch.current = true;

    async function fetchUsers() {
      try {
        const role = localStorage.getItem("userRole");
        const loginID = localStorage.getItem("loginID");

        setCurrentUserRole(role);

        let res;
        if (
          role === "Super Admin" ||
          role === "Management" ||
          role === "HR" ||
          role === "Admin"
        ) {
          // ✅ Fetch ALL users
          res = await fetch("/api/users");
        } else if (loginID) {
          // ✅ Fetch only logged-in user's record
          res = await fetch(`/api/users/profile/${loginID}`);
        }

        const data = await res.json();

        // Normalize into array so downstream code still works
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && typeof data === "object") {
          setUsers([data]);
        }
        
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        if (Array.isArray(data)) setRoles(data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    }

    fetchUsers();
    fetchRoles();
  }, []);

  // 👁️ Fetch + Open View Drawer
  const handleViewUser = async (user) => {
    router.push(`/main/UserProfile?userID=${user.id}`);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
        <p className="text-indigo-600 text-lg font-medium animate-pulse">
          Fetching users...
        </p>
      </div>
    );
  if (!users.length) return <div className="p-8">No users found.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const userData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      primaryEmail: formData.get("primaryEmail"),
      secondaryEmail: formData.get("secondaryEmail"),
      password: formData.get("password"),
      fatherName: formData.get("fatherName"),
      phone: formData.get("phone"),
      cnic: formData.get("cnic"),
      emergencyContact: formData.get("emergencyContact"),
      emergencyRelation: formData.get("emergencyRelation"),
      role: formData.get("role"),
      medicalCondition: formData.get("medicalCondition"),
      jd: formData.get("jd"),
      exp: formData.get("exp"),
      accHolderName: formData.get("accHolderName"),
      accNumber: formData.get("accNumber"),
      bankName: formData.get("bankName"),
      iban: formData.get("iban"),
      joiningDate: formData.get("joiningDate"),
      isActive: formData.get("isActive") !== null,
    };
    try {
      const res = await fetch(
        selectedUser ? `/api/users/${userFormData.id}` : "/api/users",
        {
          method: selectedUser ? "PUT" : "POST", // ✅ PUT if editing, POST if adding
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      if (!res.ok) {
        throw new Error(
          selectedUser ? "Failed to update user" : "Failed to create user"
        );
      }

      const data = await res.json();

      // ✅ If new user created
      if (!selectedUser) {
        console.log("✅ User created successfully!");
        console.log("🆔 User ID:", data.userId);
        console.log("🎭 Role:", data.role);

        // ✅ Create default access control for new user
        const accessRes = await fetch(
          "/api/UserAccessControl/insertdefaultaccess",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.userId,
              roleId: data.role, // 👈 backend expects roleId
            }),
          }
        );

        if (!accessRes.ok) {
          console.error("⚠️ Failed to insert default access control");
        } else {
          const accessData = await accessRes.json();
          console.log("✅ Default access inserted:", accessData);
        }
      }
      // ✅ If existing user updated
      else {
        console.log("✅ User updated successfully!");
        console.log("🆔 User ID:", userFormData.id);
        console.log("🎭 Role:", userData.role);

        // ✅ Update default access only if role changed
        const accessUpdateRes = await fetch(
          "/api/UserAccessControl/updatedefaultaccess",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userFormData.id,
              roleId: userData.role, // 👈 backend checks if changed
            }),
          }
        );

        if (!accessUpdateRes.ok) {
          console.error("⚠️ Failed to update default access control");
        } else {
          const updateAccessData = await accessUpdateRes.json();
          console.log("🔁 Access control update result:", updateAccessData);
        }
      }

      setSelectedUser(null);
      // ✅ Success message
      setDrawerOpen(false);
      setMessage(
        selectedUser
          ? "✅ User updated successfully!"
          : "✅ User created successfully!"
      );
      setSuccess(true);

      // ✅ Refresh user list
      const updatedRes = await fetch("/api/users");
      setUsers(await updatedRes.json());

      // ✅ Reset form fields
      e.target.reset();
    } catch (err) {
      console.error("❌ Error saving user:", err);
      setMessage(
        selectedUser ? "❌ Failed to update user" : "❌ Failed to create user"
      );
      setSuccess(false);
    } finally {
      // remove toast after 3s
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleToggleActive = async (userId, newStatus) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: newStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update active status", err);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null); // 👉 reset for new user
    setDrawerOpen(true);
  };

  // Edit Existing User
  const handleEditUser = async (user) => {
    try {
      // 👇 call your API to get full user details
      const res = await fetch(`/api/users/${user.id}`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Failed to fetch user");

      const fullUser = await res.json();

      setSelectedUser(fullUser); // for drawer form
      setDrawerOpen(true); // open drawer
    } catch (err) {
      console.error("❌ Error fetching full user:", err);
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ User and related access records deleted successfully!");
        setSuccess(true);

        // ✅ Refresh user list from server
        const updatedRes = await fetch("/api/users");
        const updatedUsers = await updatedRes.json();
        setUsers(updatedUsers);
      } else if (
        response.status === 400 &&
        data.error?.includes("Evaluation")
      ) {
        setMessage("⚠️ Cannot delete user — evaluation record already exists.");
        setSuccess(false);
      } else if (response.status === 404) {
        setMessage("❌ User not found. It may have been deleted already.");
        setSuccess(false);
      } else {
        setMessage(data.error || "❌ Failed to delete user.");
        setSuccess(false);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("🚨 Something went wrong while deleting the user.");
      setSuccess(false);
    }

    // ✅ Automatically hide toast after 3 seconds
    setTimeout(() => setMessage(""), 3000);
  };

  // 🔍 Filter users
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) || // 👈 FIX: use email
      user.role?.name?.toLowerCase().includes(query)
    );
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 w-full">
      {/* ✅ Toast Message */}
      {message && (
        <div className="fixed top-5 right-5 z-50">
          <div
            className={`px-4 py-2 rounded shadow-lg text-white ${
              success ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message}
          </div>
        </div>
      )}

      {/* ✅ Right Drawer (Modern + Complete) */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[32rem] md:w-[38rem] bg-white/80 backdrop-blur-2xl border-l border-gray-200/40 shadow-2xl transform transition-transform duration-500 ease-in-out z-50 rounded-l-3xl ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white rounded-tl-3xl shadow-lg">
          <h2 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <span className="text-2xl">{selectedUser ? "✏️" : "➕"}</span>
            {selectedUser ? "Edit User Profile" : "Add New User"}
          </h2>
          <button
            onClick={() => {
              setDrawerOpen(false);
              setSelectedUser(null);
            }}
            className="hover:bg-white/20 p-2 rounded-full transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-7 overflow-y-auto h-[calc(100%-72px)] scrollbar-thin scrollbar-thumb-indigo-300/70 scrollbar-track-transparent">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 🧍 First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  maxLength={50}
                  defaultValue={selectedUser?.firstName || ""}
                  className="form-input-modern bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  maxLength={50}
                  defaultValue={selectedUser?.lastName || ""}
                  className="form-input-modern bg-white text-gray-900"
                />
              </div>
            </div>

            {/* 📧 Emails */}
            <div>
              <label className="form-label">Primary Email</label>
              <input
                id="primaryEmail"
                name="primaryEmail"
                type="email"
                required
                maxLength={100}
                defaultValue={selectedUser?.primaryEmail || ""}
                className="form-input-modern bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="form-label">Secondary Email</label>
              <input
                id="secondaryEmail"
                name="secondaryEmail"
                type="email"
                maxLength={100}
                defaultValue={selectedUser?.secondaryEmail || ""}
                className="form-input-modern bg-white text-gray-900"
              />
            </div>

            {/* 🔑 Password */}
            <div>
              <label className="form-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                maxLength={128}
                className="form-input-modern bg-white text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {/* 👨 Father Name */}
            <div>
              <label className="form-label">Father Name</label>
              <input
                id="fatherName"
                name="fatherName"
                type="text"
                maxLength={100}
                defaultValue={selectedUser?.fatherName || ""}
                className="form-input-modern bg-white text-gray-900"
              />
            </div>

            {/* ☎️ Phone & CNIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  maxLength={15}
                  defaultValue={selectedUser?.phone || ""}
                  className="form-input-modern bg-white text-gray-900"
                  placeholder="03XXXXXXXXX"
                />
              </div>
              <div>
                <label className="form-label">CNIC</label>
                <input
                  id="cnic"
                  name="cnic"
                  type="text"
                  maxLength={15}
                  defaultValue={selectedUser?.cnic || ""}
                  className="form-input-modern bg-white text-gray-900"
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
            </div>

            {/* 🚨 Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Emergency Contact</label>
                <input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="text"
                  maxLength={15}
                  defaultValue={selectedUser?.emergencyContact || ""}
                  className="form-input-modern bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="form-label">Emergency Relation</label>
                <input
                  id="emergencyRelation"
                  name="emergencyRelation"
                  type="text"
                  maxLength={50}
                  defaultValue={selectedUser?.emergencyRelation || ""}
                  className="form-input-modern bg-white text-gray-900"
                  placeholder="Brother, Sister, etc."
                />
              </div>
            </div>

            {/* 🏷️ Role */}
            <div>
              <label className="form-label">Role</label>
              <select
                id="role"
                name="role"
                value={userFormData.role?._id || userFormData.role || ""}
                onChange={(e) =>
                  setUserFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="form-input-modern bg-white text-gray-900"
                required
                disabled={
                  !["Super Admin", "Admin", "HR", "Management"].includes(
                    currentUserRole
                  )
                }
              >
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.description}
                  </option>
                ))}
              </select>
            </div>

            {/* 📅 Joining Date */}
            <div>
              <label className="form-label">Joining Date</label>
              <input
                id="joiningDate"
                name="joiningDate"
                type="date"
                disabled={
                  currentUserRole === "Staff" ||
                  currentUserRole === "Temp Staff"
                }
                required
                defaultValue={
                  selectedUser?.joiningDate
                    ? new Date(selectedUser.joiningDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                className="form-input-modern bg-white text-gray-900"
              />
            </div>

            {/* ❤️ Medical Condition */}
            <div>
              <label className="form-label">Medical Condition</label>
              <input
                id="medicalCondition"
                name="medicalCondition"
                type="text"
                maxLength={200}
                defaultValue={selectedUser?.medicalCondition || ""}
                className="form-input-modern bg-white text-gray-900"
              />
            </div>

            {/* 💼 Software Designation List */}
            <div>
              <label className="form-label">Designation</label>
              <select
                id="jd"
                name="jd"
                disabled={
                  currentUserRole === "Staff" ||
                  currentUserRole === "Temp Staff"
                }
                value={userFormData.jd || ""}
                onChange={(e) =>
                  setUserFormData((prev) => ({ ...prev, jd: e.target.value }))
                }
                className="form-input-modern bg-white text-gray-900"
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                }}
              >
                <option value="Software Developer">Software Developer</option>
                <option value="Associate Software Developer">
                  Associate Software Developer
                </option>
                <option value="Business Dev">Business Dev</option>
                <option value="Full Stack Developer">
                  Full Stack Developer
                </option>
                <option value="Full Stack Developer Intern">
                  Full Stack Developer Intern
                </option>
                <option value="Senior Software Engineer">
                  Senior Software Engineer
                </option>
                <option value="Software Quality Assurance">
                  Software Quality Assurance (SQA)
                </option>
                <option value="Junior Full Stack Developer">
                  Junior Full Stack Developer
                </option>
                <option value="ASO">
                  ASO (App Store Optimization Specialist)
                </option>
                <option value="Unity Developer">Unity Developer</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Executive">HR Executive</option>
                <option value="HR Officer">HR Officer</option>
                <option value="Vision & Strategy">Vision & Strategy</option>
                <option value="Vice President">Vice President</option>
                <option value="Chief Technology Officer">
                  Chief Technology Officer
                </option>
              </select>
            </div>

            {/* 🧾 Experience */}
            <div>
              <label className="form-label">Experience</label>
              <input
                id="exp"
                name="exp"
                type="text"
                disabled={
                  currentUserRole === "Staff" ||
                  currentUserRole === "Temp Staff"
                }
                maxLength={500}
                defaultValue={selectedUser?.exp || ""}
                className="form-input-modern bg-white text-gray-900"
                placeholder="e.g., 3 years"
              />
            </div>

            {/* 🏦 Bank Account Details */}
            <div className="border border-gray-200 bg-gray-50 rounded-2xl p-5 shadow-sm">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                🏦 Bank Account Details
              </h3>

              <div className="space-y-5">
                {/* Account Holder Name */}
                <div>
                  <label className="form-label">Account Holder Name</label>
                  <input
                    id="accHolderName"
                    name="accHolderName"
                    type="text"
                    maxLength={100}
                    defaultValue={selectedUser?.accHolderName || ""}
                    className="form-input-modern bg-white text-gray-900"
                    placeholder="e.g., Muhammad Ali"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="form-label">Account Number</label>
                  <input
                    id="accNumber"
                    name="accNumber"
                    type="text"
                    maxLength={24}
                    defaultValue={selectedUser?.accNumber || ""}
                    className="form-input-modern bg-white text-gray-900"
                    placeholder="e.g., 01234567890123"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="form-label">Bank Name</label>
                  <input
                    id="bankName"
                    name="bankName"
                    type="text"
                    maxLength={100}
                    defaultValue={selectedUser?.bankName || ""}
                    className="form-input-modern bg-white text-gray-900"
                    placeholder="e.g., Meezan Bank"
                  />
                </div>

                {/* IBAN */}
                <div>
                  <label className="form-label">IBAN</label>
                  <input
                    id="iban"
                    name="iban"
                    type="text"
                    maxLength={34}
                    defaultValue={selectedUser?.iban || ""}
                    className="form-input-modern bg-white text-gray-900"
                    placeholder="PK36MEZN0000001234567890"
                  />
                </div>
              </div>
            </div>

            {/* 🟢 Active Toggle */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Active</p>
                <p className="text-xs text-gray-500">
                  User can log in when active.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  disabled={
                    currentUserRole === "Staff" ||
                    currentUserRole === "Temp Staff"
                  }
                  checked={!!userFormData.isActive}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      isActive: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-indigo-600 transition-all duration-300 peer-focus:ring-2 peer-focus:ring-indigo-400"></div>
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></span>
              </label>
            </div>

            {/* 💾 Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 hover:from-indigo-700 hover:to-indigo-900 text-white py-3.5 rounded-2xl font-semibold shadow-lg transition-transform hover:scale-[1.02]"
            >
              💾 {selectedUser ? "Update User" : "Save User"}
            </button>
          </form>
        </div>
      </div>

      {/* 🔍 Search Box (Visible only for Super Admin, HR, Management) */}
      {(currentUserRole === "Super Admin" ||
        currentUserRole === "HR" ||
        currentUserRole === "Management" ||
        currentUserRole === "Admin") && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center justify-end flex-1 ml-4">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg 
             bg-white text-gray-900 shadow-sm
             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
             text-base placeholder-gray-400 transition"
              />
              {/* Bigger blue icon aligned vertically */}
              <Glasses className="absolute left-3 top-2.5 w-7 h-7 text-blue-500" />
            </div>

            {/* Toggle Buttons (hidden on mobile) */}
            {!isMobile && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg border transition ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 rounded-lg border transition ${
                    viewMode === "card"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "list" && !isMobile ? (
        // ✅ Main Table View
        <div className="relative">
          <div className="overflow-x-auto bg-gradient-to-br from-gray-50 to-white p-4 rounded-3xl shadow-xl border border-gray-100">
            <table className="w-full border-separate border-spacing-y-2">
              <thead className="bg-indigo-900 text-white text-xs uppercase tracking-wider rounded-xl">
                <tr className="rounded-lg overflow-hidden">
                  <th className="px-6 py-4 text-center w-28 rounded-l-xl"></th>
                  <th className="px-6 py-4 text-left font-semibold">Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Role</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Joining Date
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Active
                  </th>
                  <th className="px-6 py-4 text-center font-semibold rounded-r-xl">
                    Files
                  </th>
                </tr>
              </thead>

              <tbody>
                {Array.isArray(currentUsers) &&
                  currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Actions */}
                      <td className="px-4 py-5 text-center align-middle rounded-l-2xl">
                        <div className="flex justify-center items-center gap-4">
                          {/* 👁 View Button (Shown if canView = true) */}
                          {canView && (
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-indigo-600 hover:text-indigo-900 hover:scale-110 transition-all"
                              title="View User"
                            >
                              <Glasses className="w-6 h-6" />
                            </button>
                          )}

                          {/* ✏️ Edit Button (Shown if canEdit = true) */}
                          {canEdit && (
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-900 hover:scale-110 transition-all"
                              title="Edit User"
                            >
                              <Edit className="w-6 h-6" />
                            </button>
                          )}

                          {/* 🗑️ Delete Button */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-500 hover:text-red-700 hover:scale-110 transition-all"
                              title="Delete User"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Avatar & Name */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Image
                              src={getUserImagePath(user.id)}
                              alt={`${user.fullName} Avatar`}
                              width={60}
                              height={60}
                              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100 shadow-sm hover:scale-105 transition-transform"
                              onError={handleImageError}
                            />
                            <span
                              className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${
                                user.isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {user.fullName || "-"}
                            </div>
                            <div className="text-gray-500 text-xs font-medium mt-1">
                              {user.jd || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-gray-700 text-sm">
                        {user.email}
                      </td>
                      <td className="px-6 py-5 text-gray-700 text-sm">
                        {user.role?.description || "-"}
                      </td>
                      <td className="px-6 py-5 text-gray-500 text-sm">
                        {user.joiningDate
                          ? (() => {
                              const date = new Date(user.joiningDate);
                              const day = date
                                .getDate()
                                .toString()
                                .padStart(2, "0");
                              const month = date.toLocaleString("en-US", {
                                month: "short",
                              });
                              const year = date.getFullYear();
                              return `${day}/${month}/${year}`;
                            })()
                          : "-"}
                      </td>
                      {/* Active toggle */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center">
                          {currentUserRole === "Super Admin" ? (
                            user.role?.name === "Super Admin" ? (
                              <div
                                className={`inline-flex h-6 w-11 items-center rounded-full opacity-50 cursor-not-allowed ${
                                  user.isActive
                                    ? "bg-indigo-500"
                                    : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                                    user.isActive
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleToggleActive(user.id, !user.isActive)
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                                  user.isActive
                                    ? "bg-indigo-500"
                                    : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    user.isActive
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            )
                          ) : (
                            <div
                              className={`inline-flex h-6 w-11 items-center rounded-full ${
                                user.isActive ? "bg-indigo-500" : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                                  user.isActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* File Attachments */}
                      <td className="px-6 py-5 text-center rounded-r-2xl">
                        <button
                          onClick={() => handleOpenFrame(user)}
                          className="relative text-indigo-600 hover:text-indigo-900 hover:scale-110 transition-all"
                          title={`View ${fileCounts[user.id] ?? 0} files`}
                        >
                          <FileText className="w-6 h-6" />
                          <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
                            {fileCounts[user.id] ?? 0}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Floating Add Button (Visible only if canAdd = true) */}
          {canAdd && (
            <button
              onClick={handleAddUser}
              title="Add New User"
              className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center hover:scale-110 hover:shadow-indigo-500/40 transition-all duration-300 animate-pulse"
            >
              <Plus className="w-8 h-8" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentUsers.map((user) => (
            <div
              key={user.id}
              className="
        relative flex flex-col justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 
        shadow-lg rounded-2xl p-6 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
      "
            >
              {/* --- Header: Avatar, Name, and Role --- */}
              <div className="flex flex-col items-center text-center">
                {/* ✅ Avatar */}
                <Image
                  src={getUserImagePath(user.id)}
                  alt={`${user.fullName} Avatar`}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover shadow-md border border-gray-200 hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                />

                {/* ✅ Name & Role */}
                <h3 className="font-extrabold text-gray-900 text-lg mt-3 group-hover:text-indigo-700 transition">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </h3>
                <p className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-0.5 rounded-full inline-block mt-1">
                  {user.jd || "Designation"}
                </p>
              </div>

              {/* --- Divider --- */}
              <div className="mt-5 mb-3">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
              </div>

              {/* --- Info Section --- */}
              <div className="space-y-3 text-sm text-gray-700">
                {/* Email */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-gray-600">
                    <Mail className="w-4 h-4 text-indigo-500" /> Email:
                  </span>
                  <span className="truncate text-right max-w-[60%]">
                    {user.email || "-"}
                  </span>
                </div>

                {/* Joined Date */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-gray-600">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Joined:
                  </span>
                  <span>{new Date(user.joiningDate).toLocaleDateString()}</span>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-gray-600">
                    <Check className="w-4 h-4 text-indigo-500" /> Active:
                  </span>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={user.isActive ? "Currently Active" : "Inactive"}
                  ></span>
                </div>
              </div>

              {/* --- Buttons Row (moved to bottom, no overlap) --- */}
              <div className="flex justify-center gap-3 mt-6">
                {canView && (
                  <button
                    onClick={() => handleViewUser(user)}
                    className="p-2 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                    title="View Details"
                  >
                    <Glasses className="w-5 h-5" />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 rounded-full bg-yellow-50 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all shadow-md"
                    title="Edit User"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-md"
                    title="Delete User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* ➕ Add New User Card */}
          {canAdd && (
            <div
              onClick={handleAddUser}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer transition duration-300 
        hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-inner"
            >
              <Plus className="w-14 h-14 text-indigo-600/80" />
              <span className="mt-4 text-indigo-700 font-bold text-lg">
                Add New User
              </span>
              <p className="text-sm text-gray-500 mt-1">Management Access</p>
            </div>
          )}
        </div>
      )}

      {/* ✅ Pagination + Info (visible only for Super Admin, HR, or Management) */}
      {["Super Admin", "HR", "Management", "Admin"].includes(
        currentUserRole
      ) && (
        <div className="flex justify-end items-center mt-4 space-x-4">
          <p className="text-sm text-gray-500">
            Showing {indexOfFirstUser + 1} -{" "}
            {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
            {filteredUsers.length}
          </p>

          <div className="flex space-x-2">
            {/* Prev Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>

            {/* Page Numbers */}
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => handlePageChange(idx + 1)}
                className={`px-3 py-1 border rounded-md text-sm transition ${
                  currentPage === idx + 1
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {idx + 1}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ✅ Floating Center Frame */}
      {fileFrameUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-3">
          <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] bg-white shadow-2xl rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h2 className="text-base sm:text-lg font-semibold text-indigo-900">
                {fileFrameUser.fullName} – Files
              </h2>
              <button
                onClick={() => setFileFrameUser(null)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1">
              {fileFrameUser.files && fileFrameUser.files.length > 0 ? (
                fileFrameUser.files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-indigo-50 rounded-lg p-3 shadow-sm border border-white"
                  >
                    {/* Top Row: Title + Actions */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                        {file.title}
                      </h3>
                      <div className="flex space-x-3">
                        {/* ✅ View File */}
                        <a
                          href={file.url || file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View File"
                        >
                          <FileText className="w-5 h-5" />
                        </a>

                        {/* ✅ Delete File */}
                        {["Super Admin", "HR", "Management", "Admin"].includes(
                          currentUserRole
                        ) && (
                          <button
                            onClick={() => handleDeleteFile(file)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete File"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* File Name */}
                    <p className="text-xs text-gray-500 mt-1 italic truncate">
                      {file.fileName ||
                        file.url?.split("/").pop() ||
                        file.fileUrl?.split("/").pop()}
                    </p>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {file.description || "No description"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">
                  No files attached.
                </p>
              )}
            </div>

            {/* Upload New File */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="
      w-full rounded-lg px-3 py-2 text-sm 
      border border-gray-300 
      bg-white               /* ALWAYS WHITE */
      text-gray-800         
      placeholder-gray-500  
      focus:ring-2 focus:ring-indigo-400 focus:outline-none
    "
              />

              <textarea
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="
      w-full rounded-lg px-3 py-2 text-sm 
      border border-gray-300
      bg-white               /* ALWAYS WHITE */
      text-gray-800
      placeholder-gray-500
      focus:ring-2 focus:ring-indigo-400 focus:outline-none
    "
                rows={2}
              />

              <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files[0])}
                  className="
        w-full sm:flex-1 rounded-lg text-sm px-2 py-1 
        border border-gray-300
        bg-white               /* ALWAYS WHITE */
        text-gray-800
        focus:outline-none
      "
                />

                {/* Upload Button with Role Check */}
                {(() => {
                  const canUpload = [
                    "Super Admin",
                    "Admin",
                    "Management",
                    "HR",
                  ].includes(currentUserRole);

                  return (
                    <button
                      onClick={handleUpload}
                      disabled={!canUpload}
                      className={`
            w-full sm:w-auto px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition
            ${
              canUpload
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed"
            }
          `}
                      title={
                        canUpload
                          ? "Upload File"
                          : "You do not have permission to upload files"
                      }
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
