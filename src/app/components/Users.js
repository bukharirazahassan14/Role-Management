"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Glasses, Plus, X, FileText, Upload, Trash2, Edit } from "lucide-react"; // icons

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false); // view user drawer
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
  const usersPerPage = 10; // change number of rows per page

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
    password: "",
    isActive: true,
  });

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
    if (didFetch.current) return; // ✅ stop duplicate calls
    didFetch.current = true;

    async function fetchUsers() {
      try {
        // ✅ get logged-in role from localStorage
        const role = localStorage.getItem("userRole");
        setCurrentUserRole(role);
        const res = await fetch("/api/users");
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
        // fetch counts for all users
        data.forEach((u) => fetchFileCount(u.id));
      } catch (err) {
        console.error(err);
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
        console.error(err);
      }
    }

    fetchUsers();
    fetchRoles();
  }, []);

  const handleRoleChange = async (userId, roleId) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
      );

      setMessage("✅ Role updated successfully!");
      setSuccess(true);

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update role");
      setSuccess(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // 👁️ Fetch + Open View Drawer
  const handleViewUser = async (user) => {
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user details");
      const data = await res.json();
      setSelectedUser(data); // full details
      setViewDrawerOpen(true);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load user details");
      setSuccess(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) return <div className="p-8">Loading users...</div>;
  if (!users.length) return <div className="p-8">No users found.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📌 Submitting User Data:", userFormData);
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
      isActive: formData.get("isActive") !== null,
    };

    console.log("📌 Submitting User Data:", userData);

    try {
      const res = await fetch(
        userFormData.id ? `/api/users/${userFormData.id}` : "/api/users",
        {
          method: selectedUser ? "PUT" : "POST", // ✅ PUT if updating, POST if creating
          body: JSON.stringify(userData),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error(
          selectedUser ? "Failed to update user" : "Failed to create user"
        );
      }

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
      setSelectedUser(null);
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
        className={`fixed top-0 right-0 h-full w-full sm:w-[28rem] md:w-[34rem] bg-white/90 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-in-out z-50 rounded-l-2xl ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-indigo-900 text-white rounded-tl-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">{selectedUser ? "✏️" : "➕"}</span>
            {selectedUser ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={() => {
              setDrawerOpen(false);
              setSelectedUser(null); // reset when closing
            }}
            className="hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-70px)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  defaultValue={selectedUser?.firstName || ""}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  defaultValue={selectedUser?.lastName || ""}
                  className="form-input"
                />
              </div>
            </div>

            {/* Emails */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Primary Email
              </label>
              <input
                id="primaryEmail"
                name="primaryEmail"
                type="email"
                required
                defaultValue={selectedUser?.primaryEmail || ""}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Secondary Email
              </label>
              <input
                id="secondaryEmail"
                name="secondaryEmail"
                type="email"
                defaultValue={selectedUser?.secondaryEmail || ""}
                className="form-input"
              />
            </div>

            {/* Password with Reset Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Father Name
              </label>
              <input
                id="fatherName"
                name="fatherName"
                type="text"
                defaultValue={selectedUser?.fatherName || ""}
                className="form-input"
              />
            </div>

            {/* Phone & CNIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  defaultValue={selectedUser?.phone || ""}
                  className="form-input"
                  placeholder="03XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  CNIC
                </label>
                <input
                  id="cnic"
                  name="cnic"
                  type="text"
                  defaultValue={selectedUser?.cnic || ""}
                  className="form-input"
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Emergency Contact
                </label>
                <input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="text"
                  defaultValue={selectedUser?.emergencyContact || ""}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Emergency Relation
                </label>
                <input
                  id="emergencyRelation"
                  name="emergencyRelation"
                  type="text"
                  defaultValue={selectedUser?.emergencyRelation || ""}
                  className="form-input"
                  placeholder="Brother, Sister, etc."
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="form-label">Role</label>
              <select
                id="role"
                name="role"
                value={userFormData.role?._id || userFormData.role || ""}
                onChange={(e) =>
                  setUserFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="form-input"
                disabled={
                  roles.find(
                    (r) =>
                      r._id === (userFormData.role?._id || userFormData.role)
                  )?.name === "Super Admin"
                }
              >
                {roles
                  .filter((role) => {
                    // ✅ Only include "Super Admin" if it's already the user's role
                    if (role.name === "Super Admin") {
                      return (
                        roles.find(
                          (r) =>
                            r._id ===
                            (userFormData.role?._id || userFormData.role)
                        )?.name === "Super Admin"
                      );
                    }
                    return true;
                  })
                  .map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Medical Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Medical Condition
              </label>
              <input
                id="medicalCondition"
                name="medicalCondition"
                type="text"
                defaultValue={selectedUser?.medicalCondition || ""}
                className="form-input"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Job Description
              </label>
              <textarea
                id="jd"
                name="jd"
                className="form-input min-h-24"
                placeholder="Responsibilities, duties, etc."
                defaultValue={selectedUser?.jd || ""}
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Experience
              </label>
              <input
                id="exp"
                name="exp"
                type="text"
                defaultValue={selectedUser?.exp || ""}
                className="form-input"
                placeholder="e.g., 3 years"
              />
            </div>

            {/* ✅ Active Toggle */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
                <span className="text-xs text-gray-500">
                  User can log in when active.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={!!userFormData.isActive} // always boolean
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      isActive: e.target.checked, // toggle on/off
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-indigo-600 transition-all duration-300 peer-focus:ring-2 peer-focus:ring-indigo-400"></div>
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white py-3 rounded-xl font-semibold shadow-lg transition mt-2"
            >
              💾 {selectedUser ? "Update User" : "Save User"}
            </button>
          </form>
        </div>
      </div>

      {/* 👁️ View Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[34rem] bg-gray-50 shadow-2xl transform transition-transform duration-300 z-50 ${
          viewDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-indigo-900 text-white rounded-tr-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Glasses className="w-5 h-5" /> View User
          </h2>
          <button
            onClick={() => setViewDrawerOpen(false)}
            className="hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto h-[calc(100%-60px)] space-y-6">
          {selectedUser ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white shadow rounded-xl p-4 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {selectedUser.firstName?.[0]}
                  {selectedUser.lastName?.[0]}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-800">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedUser.role?.name || "No Role"}
                </p>
              </div>

              {/* Details Grid */}
              <div className="bg-white shadow rounded-xl p-4 space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">
                  Contact Info
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <p className="break-words">
                    <span className="font-medium">Primary Email:</span>
                    <br />
                    {selectedUser.primaryEmail}
                  </p>
                  <p className="break-words">
                    <span className="font-medium">Secondary Email:</span>
                    <br />
                    {selectedUser.secondaryEmail || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>
                    <br />
                    {selectedUser.phone || "-"}
                  </p>
                  <p>
                    <span className="font-medium">CNIC:</span>
                    <br />
                    {selectedUser.cnic || "-"}
                  </p>
                </div>
              </div>

              {/* Emergency Section */}
              <div className="bg-white shadow rounded-xl p-4 space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">
                  Emergency
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Contact:</span>
                    <br />
                    {selectedUser.emergencyContact || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Relation:</span>
                    <br />
                    {selectedUser.emergencyRelation || "-"}
                  </p>
                </div>
              </div>

              {/* Job Info */}
              <div className="bg-white shadow rounded-xl p-4 space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">
                  Job Info
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Medical Condition:</span>
                    <br />
                    {selectedUser.medicalCondition || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Job Description:</span>
                    <br />
                    {selectedUser.jd || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Experience:</span>
                    <br />
                    {selectedUser.exp || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Created At:</span>
                    <br />
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading user details...</p>
          )}
        </div>
      </div>

      {/* 🔍 Modern Minimal Search Box */}
      <div className="flex items-center justify-end p-4">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg 
                 bg-white shadow-sm
                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                 text-base placeholder-gray-400 transition"
          />
          {/* Bigger blue icon aligned vertically */}
          <Glasses className="absolute left-3 top-2.5 w-7 h-7 text-blue-500" />
        </div>
      </div>

      {/* ✅ Main Table */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
        <table className="w-full text-left">
          <thead className="bg-indigo-900 text-white">
            <tr>
              <th className="px-6 py-3 w-28 text-center">
                {(currentUserRole === "Super Admin" ||
                  currentUserRole === "HR" ||
                  currentUserRole === "Management") && (
                  <button
                    onClick={handleAddUser}
                    className="bg-white text-indigo-900 rounded-full p-2 shadow hover:bg-gray-100 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Created At</th>
              <th className="px-6 py-3 text-center">Active</th>
              <th className="px-6 py-3 text-center">Attached File</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-indigo-50 transition border-b last:border-none"
              >
                <td className="px-4 py-4 text-center align-middle">
                  <div className="flex justify-center items-center gap-6">
                    {/* 👓 View Button */}
                    <button
                      onClick={() => handleViewUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 transition"
                      title="View User"
                    >
                      <Glasses className="w-6 h-6" />
                    </button>

                    {/* ✏️ Edit Button */}
                    {(currentUserRole === "Super Admin" ||
                      currentUserRole === "HR" ||
                      currentUserRole === "Management") && (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 transition"
                        title="Edit User"
                      >
                        <Edit className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </td>

                <td className="px-8 py-4">{user.fullName || ""}</td>
                <td className="px-6 py-4">{user.email || "-"}</td>
                <td className="px-3 py-4">
                  <select
                    value={user.role?._id || ""}
                    disabled={
                      currentUserRole === "Staff" ||
                      currentUserRole === "Temp Staff" ||
                      ((currentUserRole === "Super Admin" ||
                        currentUserRole === "Management" ||
                        currentUserRole === "HR") &&
                        user.role?.name === "Super Admin")
                    }
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="w-52 px-3 py-2 border border-white rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  >
                    {roles
                      .filter((role) => {
                        // ✅ Staff / Temp Staff → show all options (but disabled anyway)
                        if (
                          currentUserRole === "Staff" ||
                          currentUserRole === "Temp Staff"
                        ) {
                          return true;
                        }

                        // ✅ Management / HR → hide "Super Admin" unless the row itself is Super Admin
                        if (
                          (currentUserRole === "Management" ||
                            currentUserRole === "HR") &&
                          role.name === "Super Admin" &&
                          user.role?.name !== "Super Admin"
                        ) {
                          return false;
                        }

                        // ✅ Super Admin → hide "Super Admin" option from all other rows
                        if (
                          currentUserRole === "Super Admin" &&
                          role.name === "Super Admin" &&
                          user.role?.name !== "Super Admin"
                        ) {
                          return false;
                        }

                        return true;
                      })
                      .map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "-"}
                </td>

                {/* ✅ Active Toggle Switch (Only for Super Admin) */}
                <td className="px-6 py-4 text-center">
                  {currentUserRole === "Super Admin" ? (
                    user.role === "Super Admin" ||
                    user.role?.name === "Super Admin" ? (
                      // 🔒 Disable toggle for Super Admin rows
                      <span
                        className={`inline-flex h-6 w-11 items-center rounded-full opacity-50 cursor-not-allowed ${
                          user.isActive ? "bg-indigo-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                            user.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </span>
                    ) : (
                      // ✅ Allow toggle for other users
                      <button
                        onClick={() =>
                          handleToggleActive(user.id, !user.isActive)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          user.isActive ? "bg-indigo-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            user.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    )
                  ) : (
                    // 🔹 Non-Super Admins → always read-only
                    <span
                      className={`inline-flex h-6 w-11 items-center rounded-full ${
                        user.isActive ? "bg-indigo-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                          user.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleOpenFrame(user)}
                    className="relative inline-flex items-center justify-center text-indigo-600 hover:text-indigo-900 transition"
                  >
                    <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {fileCounts[user.id] ?? 0}
                    </span>
                    <FileText className="w-6 h-6" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination + Info (all on right side) */}
      <div className="flex justify-end items-center mt-4 space-x-4">
        <p className="text-sm text-gray-500">
          Showing {indexOfFirstUser + 1} -{" "}
          {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
          {filteredUsers.length}
        </p>

        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>

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

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

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
                        {["Super Admin", "HR", "Management"].includes(
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
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-white rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
              <textarea
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border border-white rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                rows={2}
              />
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files[0])}
                  className="w-full sm:flex-1 border border-white rounded-lg text-sm px-2 py-1 bg-gray-50 focus:outline-none"
                />
                <button
                  onClick={handleUpload}
                  disabled={
                    !["Super Admin", "HR", "Management"].includes(
                      currentUserRole
                    )
                  }
                  className={`w-full sm:w-auto px-3 py-2 rounded-lg flex items-center justify-center space-x-1 ${
                    ["Super Admin", "HR", "Management"].includes(
                      currentUserRole
                    )
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
