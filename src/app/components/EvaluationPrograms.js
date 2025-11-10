"use client";
import { useEffect, useState } from "react";
import { Plus, X, Check, ClipboardList, Percent, Trash2 } from "lucide-react";

export default function EvaluationPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newProgram, setNewProgram] = useState({
    Name: "",
    Description: "",
    Weightage: "",
  });

   const canEdit =
    currentUserRole === "Super Admin" ||
    currentUserRole === "HR" ||
    currentUserRole === "Management";

  // ✅ Fetch evaluation programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const role = localStorage.getItem("userRole");
        setCurrentUserRole(role);
        const res = await fetch("/api/weeklyevaluation/evaluationprograms");
        if (!res.ok) throw new Error("Failed to fetch programs");
        const data = await res.json();
        setPrograms(data);
      } catch (err) {
        console.error("❌ Error fetching programs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const handleUpdate = async (id, field, value) => {
    try {
      setPrograms((prev) =>
        prev.map((p) => (p._id === id ? { ...p, [field]: value } : p))
      );

      const res = await fetch("/api/weeklyevaluation/evaluationprograms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessage(errData.error || "Failed to update program");
        setSuccess(false);
        setEditingField(null);
        setTimeout(() => setMessage(""), 3000);
        return; // ✅ no throw, no console red error
      }

      const updated = await res.json();
      setPrograms((prev) => prev.map((p) => (p._id === id ? updated : p)));
      setMessage(`${field} updated successfully!`);
      setSuccess(true);
    } catch (err) {
      console.error("❌ Error updating program:", err);
      setMessage("Unexpected error while updating");
      setSuccess(false);
    } finally {
      setEditingField(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // ✅ Handle add
  const handleAddProgram = async () => {
    if (!newProgram.Name || !newProgram.Description || !newProgram.Weightage) {
      setMessage("Please fill all fields");
      setSuccess(false);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const res = await fetch("/api/weeklyevaluation/evaluationprograms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProgram),
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessage(errData.error || "Failed to add program");
        setSuccess(false);
        setTimeout(() => setMessage(""), 3000);
        return; // ✅ prevent throwing
      }

      const added = await res.json();
      setPrograms((prev) => [...prev, added]);
      setMessage("Program added successfully!");
      setSuccess(true);

      setNewProgram({ Name: "", Description: "", Weightage: "" });
      setShowAddCard(false);
    } catch (err) {
      console.error("❌ Unexpected error adding program:", err);
      setMessage("Unexpected error while adding program");
      setSuccess(false);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const res = await fetch(
        `/api/weeklyevaluation/evaluationprograms/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete program");
      }

      setPrograms((prev) => prev.filter((p) => p._id !== id));
      setMessage("Program deleted successfully!");
      setSuccess(true);
    } catch (err) {
      console.error("❌ Error deleting program:", err);
      setMessage(err.message || "Error deleting program");
      setSuccess(false);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 p-8">
  {/* ✅ Toast */}
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

  {/* Header */}
  <div className="text-center mb-12">
    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
      <span className="p-2 bg-indigo-100 rounded-xl shadow-sm">
        <ClipboardList className="w-8 h-8 text-indigo-600" />
      </span>
      Evaluation Programs
    </h1>
    <div className="mt-4 h-1 w-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto shadow"></div>
  </div>

  {/* Programs List */}
  <div className="max-w-4xl mx-auto space-y-5">
    {programs.map((program) => (
      <div
        key={program._id}
        className="flex items-center justify-between bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 px-6 py-5 hover:shadow-xl hover:scale-[1.01] transition-all"
      >
        {/* Left Section */}
        <div className="flex items-start gap-4 flex-1">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl shadow-md">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            {/* Name */}
            {editingField?.id === program._id &&
            editingField?.field === "Name" &&
            canEdit ? (
              <input
                type="text"
                defaultValue={program.Name}
                className="text-lg font-semibold text-gray-900 border-b border-indigo-400 focus:outline-none bg-transparent"
                autoFocus
                onBlur={(e) =>
                  handleUpdate(program._id, "Name", e.target.value)
                }
              />
            ) : (
              <h2
                className={`text-lg font-semibold text-gray-900 ${
                  canEdit ? "cursor-pointer hover:text-indigo-600" : ""
                }`}
                onClick={() =>
                  canEdit &&
                  setEditingField({ id: program._id, field: "Name" })
                }
              >
                {program.Name}
              </h2>
            )}

            {/* Description */}
            {editingField?.id === program._id &&
            editingField?.field === "Description" &&
            canEdit ? (
              <textarea
                defaultValue={program.Description}
                rows={2}
                className="text-gray-600 text-sm border-b border-indigo-400 focus:outline-none bg-transparent resize-none w-full"
                autoFocus
                onBlur={(e) =>
                  handleUpdate(program._id, "Description", e.target.value)
                }
              />
            ) : (
              <p
                className={`text-gray-600 text-sm line-clamp-2 ${
                  canEdit ? "cursor-pointer hover:text-indigo-500" : ""
                }`}
                onClick={() =>
                  canEdit &&
                  setEditingField({ id: program._id, field: "Description" })
                }
              >
                {program.Description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        {canEdit && (
          <div className="flex items-center gap-3">
            {/* Weightage */}
            <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-indigo-100">
              {editingField?.id === program._id &&
              editingField?.field === "Weightage" ? (
                <input
                  type="number"
                  defaultValue={program.Weightage}
                  min={1}
                  max={100}
                  onInput={(e) => {
                    if (Number(e.target.value) > 100) e.target.value = "100";
                    if (Number(e.target.value) < 1) e.target.value = "1";
                  }}
                  className="w-16 text-indigo-700 font-semibold border-b border-indigo-400 focus:outline-none bg-transparent text-center"
                  autoFocus
                  onBlur={(e) =>
                    handleUpdate(program._id, "Weightage", e.target.value)
                  }
                />
              ) : (
                <span
                  onClick={() =>
                    setEditingField({ id: program._id, field: "Weightage" })
                  }
                >
                  <Percent className="w-4 h-4 inline-block mr-1" />
                  {program.Weightage}%
                </span>
              )}
            </div>

            {/* ✅ Delete Button */}
            <button
              onClick={() => handleDelete(program._id)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 shadow-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    ))}

    {programs.length === 0 && (
      <p className="text-center text-gray-500 mt-8 text-lg">
        No evaluation programs available.
      </p>
    )}
  </div>

  {/* Floating Add Section */}
  {canEdit && (
    <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3">
      {showAddCard && (
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 w-96 p-6 animate-fade-in-up transition-all">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-5 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-500" />
            New Program
          </h3>

          {/* Name Input */}
          <input
            type="text"
            placeholder="Program Name"
            value={newProgram.Name}
            onChange={(e) =>
              setNewProgram({ ...newProgram, Name: e.target.value })
            }
             className="w-full rounded-xl px-4 py-2 mb-4 
             bg-white 
             text-gray-900 
             focus:ring-2 focus:ring-indigo-400 
             outline-none transition"
          />

          {/* Description Input */}
          <textarea
            placeholder="Description"
            value={newProgram.Description}
            onChange={(e) =>
              setNewProgram({ ...newProgram, Description: e.target.value })
            }
            className="w-full rounded-xl px-4 py-3 mb-4 
             bg-white 
             text-gray-900 
             focus:ring-2 focus:ring-indigo-400 
             outline-none resize-y min-h-[80px] max-h-[200px] transition"
          />

          {/* Weightage Input */}
          <div className="flex items-center gap-2 mb-5">
            <Percent className="w-5 h-5 text-indigo-500" />
            <input
              type="number"
              placeholder="Weightage (%)"
              value={newProgram.Weightage}
              onChange={(e) =>
                setNewProgram({ ...newProgram, Weightage: e.target.value })
              }
              className="flex-1 rounded-xl px-4 py-2 bg-gray-50/70 focus:ring-2 focus:ring-indigo-400 focus:bg-white outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowAddCard(false)}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleAddProgram}
              className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:from-indigo-700 hover:to-purple-700 transition"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-5 shadow-xl transition transform hover:rotate-90"
        onClick={() => setShowAddCard(!showAddCard)}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )}
</div>

  );
}
