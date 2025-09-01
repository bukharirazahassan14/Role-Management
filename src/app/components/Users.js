"use client";

import { useEffect, useState } from "react";
import { Glasses, Plus, X, FileText, Upload, Trash2 } from "lucide-react"; // icons

export default function Users() {
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

  // Form state for uploading
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [fileCounts, setFileCounts] = useState({});

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
    if (!newFile) return alert("Please select a file!");

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

    const formData = new FormData(e.target);

    const newUser = {
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
    };

    console.log("📌 New User:", newUser);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to create user");
      }

      // ✅ success message
      setDrawerOpen(false);
      setMessage("✅ User created successfully!");
      setSuccess(true);

      // ✅ refresh user list
      const updatedRes = await fetch("/api/users");
      setUsers(await updatedRes.json());

      // ✅ reset form fields
      e.target.reset();
    } catch (err) {
      console.error("Error creating user:", err);
      setMessage("❌ Failed to create user");
      setSuccess(false);
    } finally {
      // remove toast after 3s
      setTimeout(() => setMessage(""), 3000);
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

      {/* ✅ Right Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">➕ Add New User</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Content (Form) */}
        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Emails */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Primary Email
              </label>
              <input
                id="primaryEmail"
                name="primaryEmail"
                type="email"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Secondary Email
              </label>
              <input
                id="secondaryEmail"
                name="secondaryEmail"
                type="email"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Father Name
              </label>
              <input
                id="fatherName"
                name="fatherName"
                type="text"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {/* Phone & CNIC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CNIC
                </label>
                <input
                  id="cnic"
                  name="cnic"
                  type="text"
                  className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Emergency Contact
              </label>
              <input
                id="emergencyContact"
                name="emergencyContact"
                type="text"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Emergency Relation
              </label>
              <input
                id="emergencyRelation"
                name="emergencyRelation"
                type="text"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Medical, JD, Exp */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medical Condition
              </label>
              <input
                id="medicalCondition"
                name="medicalCondition"
                type="text"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                id="jd"
                name="jd"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Experience
              </label>
              <input
                id="exp"
                name="exp"
                type="text"
                className="mt-1 w-full rounded-xl px-3 py-2 bg-gray-50 border border-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-indigo-900 hover:bg-indigo-700 text-white py-2 rounded-xl font-semibold shadow-md transition mt-6"
            >
              Save User
            </button>
          </form>
        </div>
      </div>

      {/* 👁️ View Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[30rem] bg-gray-50 shadow-2xl transform transition-transform duration-300 z-50 ${
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

      {/* ✅ Main Table */}

      <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
        <table className="w-full text-left">
          <thead className="bg-indigo-900 text-white">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                {(currentUserRole === "Super Admin" ||
                  currentUserRole === "HR" ||
                  currentUserRole === "Management") && (
                  <button
                    onClick={() => setDrawerOpen(true)}
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
              <th className="px-6 py-3 text-center">Attached File</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-indigo-50 transition border-b last:border-none"
              >
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleViewUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 transition"
                    title="View User"
                  >
                    <Glasses className="w-6 h-6" />
                  </button>
                </td>
                <td className="px-6 py-4">{user.fullName || ""}</td>
                <td className="px-6 py-4">{user.email || "-"}</td>
                <td className="px-6 py-4">
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

      {/* ✅ Floating Center Frame */}
      {fileFrameUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="w-[500px] h-[500px] bg-white shadow-2xl rounded-2xl border border-gray-200 p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h2 className="text-lg font-semibold text-indigo-900">
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
                      <h3 className="font-medium text-gray-800">
                        {file.title}
                      </h3>

                      <div className="flex space-x-3">
                        {/* ✅ View File (Visible to all users) */}
                        <a
                          href={file.url || file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View File"
                        >
                          <FileText className="w-5 h-5" />
                        </a>

                        {/* ✅ Delete File (Restricted to Super Admin, HR, Management) */}
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
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {file.fileName ||
                        file.url?.split("/").pop() ||
                        file.fileUrl?.split("/").pop()}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mt-1">
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
  <div className="flex items-center space-x-2">
    <input
      type="file"
      onChange={(e) => setNewFile(e.target.files[0])}
      className="flex-1 border border-white rounded-lg text-sm px-2 py-1 bg-gray-50 focus:outline-none"
    />

    {/* ✅ Upload button restricted */}
    <button
      onClick={handleUpload}
      disabled={!["Super Admin", "HR", "Management"].includes(currentUserRole)}
      className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
        ["Super Admin", "HR", "Management"].includes(currentUserRole)
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
