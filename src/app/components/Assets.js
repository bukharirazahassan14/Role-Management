"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLaptop,
  FaDesktop,
  FaMobileAlt,
  FaHeadphones,
  FaBolt,
  FaBox,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaSearch,
  FaTimes,
  FaEdit,
  FaTrashAlt,
} from "react-icons/fa";

// --- MODERN & PROFESSIONAL THEME ---

/* Status Colors - Sophisticated and clear colors */
const statusColors = {
  Assigned: "bg-blue-100 text-blue-800 ring-1 ring-blue-500/30", // Primary Action Blue
  Available: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/30", // Success Green
  Maintenance: "bg-amber-100 text-amber-800 ring-1 ring-amber-500/30", // Warning Amber
};

/* Asset Colors - Subtle, yet distinct pastel/muted tones */
const assetColors = {
  Laptop: "bg-sky-50 text-sky-700",
  "Mobile Phone": "bg-purple-50 text-purple-700",
  Headphone: "bg-pink-50 text-pink-700",
  Charger: "bg-yellow-50 text-yellow-700",
  Screen: "bg-teal-50 text-teal-700",
  Other: "bg-gray-100 text-gray-700",
};

/* Asset Icons - Retaining existing, ensuring good size/spacing */
const assetIcons = {
  Laptop: <FaLaptop className="inline mr-1" />,
  "Mobile Phone": <FaMobileAlt className="inline mr-1" />,
  Headphone: <FaHeadphones className="inline mr-1" />,
  Charger: <FaBolt className="inline mr-1" />,
  Screen: <FaDesktop className="inline mr-1" />,
  Other: <FaBox className="inline mr-1" />,
};

// --- COMPONENT START ---

export default function AssetsPage() {
  const [filter, setFilter] = useState("All Assets");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [assets, setAssets] = useState([]);

  // Dynamic metrics based on current assets
  const metrics = useMemo(
    () => [
      { title: "Total Assets", value: assets.length, color: "gray", icon: <FaBox className="text-gray-500" /> },
      {
        title: "Assigned",
        value: assets.filter((a) => a.status === "Assigned").length,
        color: "blue",
        icon: <FaLaptop className="text-blue-500" />,
      },
      {
        title: "Available",
        value: assets.filter((a) => a.status === "Available").length,
        color: "green",
        icon: <FaPlus className="text-emerald-500" />,
      },
      {
        title: "In Maintenance",
        value: assets.filter((a) => a.status === "Maintenance").length,
        color: "orange",
        icon: <FaBolt className="text-amber-500" />,
      },
    ],
    [assets]
  );

  const [counts, setCounts] = useState(metrics.map(() => 0));
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [showAddCard, setShowAddCard] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newAsset, setNewAsset] = useState({
    name: "",
    type: "Laptop",
    assignedTo: "",
    serial: "",
    purchase: "",
    value: "",
    note: "",
    status: "Available",
  });

  /* Counter Animation */
  useEffect(() => {
    // Reset counts when metrics change (e.g., assets load/update)
    setCounts(metrics.map(() => 0)); 
    
    // Only run animation if metrics have values (assets have loaded)
    if (assets.length > 0 || metrics.some(m => m.value > 0)) {
        const timers = metrics.map((m, i) => {
            let x = 0;
            const timer = setInterval(() => {
                x++;
                setCounts((p) => {
                    const updated = [...p];
                    // Ensure we don't exceed the final value
                    updated[i] = x > m.value ? m.value : x;
                    return updated;
                });
                if (x >= m.value) clearInterval(timer);
            }, 20);
            return timer;
        });
        return () => timers.forEach(clearInterval);
    }
  }, [metrics, assets.length]); // Depend on metrics and assets.length to re-trigger on data change

  /* Fetch assets from API */
  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch("/api/assets/asset_list");
        const data = await res.json();
        
        const assetsWithId = data.map((asset, index) => ({
          frontendId: `A${String(index + 1).padStart(3, "0")}`,
          ...asset, // includes _id from MongoDB
        }));
        setAssets(assetsWithId);
      } catch (err) {
        console.error("❌ Failed to fetch assets:", err);
      }
    }
    fetchAssets();
  }, []);

  /* Filtering & Sorting Logic */
  let filteredAssets = assets.filter((a) => {
    const f = filter === "All Assets" || a.status === filter;

    const s =
      (a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.assignedTo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.serial || "").toLowerCase().includes(searchQuery.toLowerCase());

    return f && s;
  });

  if (sortConfig.key) {
    filteredAssets.sort((a, b) => {
      let x = a[sortConfig.key] || "";
      let y = b[sortConfig.key] || "";
      if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
      if (x > y) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) =>
    sortConfig.key !== key ? (
      <FaSort className="ml-1 text-gray-300 group-hover:text-gray-500 transition-colors" />
    ) : sortConfig.direction === "asc" ? (
      <FaSortUp className="ml-1 text-blue-600" />
    ) : (
      <FaSortDown className="ml-1 text-blue-600" />
    );

  /* Reset Form */
  const resetForm = () => {
    setEditingId(null);
    setNewAsset({
      name: "",
      type: "Laptop",
      assignedTo: "",
      serial: "",
      purchase: "",
      value: "",
      note: "",
      status: "Available",
    });
    setShowAddCard(false);
  };

  /* Add Asset */
  const handleAddAsset = async () => {
    // Basic validation to prevent empty submission
    if (!newAsset.name || !newAsset.serial) {
        alert("Please fill in Asset Name and Serial Number.");
        return;
    }
    try {
      const res = await fetch("/api/assets/add_asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add asset");

      // Calculate new frontendId based on the current length + 1
      const frontendId = `A${String(assets.length + 1).padStart(3, "0")}`;

      setAssets([...assets, { frontendId, ...data.asset }]);
      resetForm();
    } catch (err) {
      console.error("❌ Error adding asset:", err);
      alert(err.message);
    }
  };

  /* Update Asset */
  const handleUpdateAsset = async () => {
    // Basic validation to prevent empty submission
    if (!newAsset.name || !newAsset.serial) {
        alert("Please fill in Asset Name and Serial Number.");
        return;
    }
    try {
      const res = await fetch(`/api/assets/update/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update asset");

      setAssets((prev) =>
        prev.map((a) =>
          a._id === editingId ? { frontendId: a.frontendId, ...data.asset } : a
        )
      );

      resetForm();
    } catch (err) {
      console.error("❌ Error updating asset:", err);
      alert(err.message);
    }
  };

  /* Delete Asset */
  const handleDeleteAsset = async (id) => {
    if (!confirm("Are you sure you want to delete this asset? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/assets/update/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete asset");

      setAssets((prev) => prev.filter((a) => a._id !== id));
      alert("Asset deleted successfully");
    } catch (err) {
      console.error("❌ Error deleting asset:", err);
      alert(err.message);
    }
  };

  /* Handle Row Double Click for Editing */
  const handleRowDoubleClick = (asset) => {
    setEditingId(asset._id);
    setNewAsset({ 
        // Ensure all fields are copied, including any optional ones not in the original form state
        ...newAsset, // Use newAsset defaults for missing fields
        ...asset, 
        // Format date correctly for input type="date" if it's stored as a different format
        purchase: asset.purchase ? asset.purchase.split('T')[0] : "" // Assuming asset.purchase is YYYY-MM-DD or similar
    }); 
    setShowAddCard(true);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 text-gray-900 font-sans">
      
      {/* Metrics - Enhanced Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {metrics.map((m, i) => (
          <motion.div
            key={i}
           className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-indigo-500/70 flex items-center justify-between transition transform hover:shadow-2xl hover:-translate-y-1"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{m.title}</p>
                <p className="text-4xl font-extrabold text-gray-900">
                {counts[i]}
                </p>
            </div>
            <div className={`p-3 rounded-full ${m.color === 'blue' ? 'bg-blue-100' : m.color === 'green' ? 'bg-emerald-100' : m.color === 'orange' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                {m.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Inventory Header & Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Listing</h2>
          
        </div>
        <button
          className={`px-6 py-2.5 font-semibold rounded-xl shadow-lg transition duration-200 flex items-center ${
            showAddCard && !editingId
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={() => {
            resetForm();
            setShowAddCard(!showAddCard);
          }}
        >
          {showAddCard && !editingId ? (
            <FaTimes className="mr-2" />
          ) : (
            <FaPlus className="mr-2" />
          )}
          {showAddCard && !editingId ? "Close Form" : "Register New Asset"}
        </button>
      </div>

      {/* Add / Edit Asset Card - Elevated Form Design */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white p-6 rounded-2xl shadow-2xl mb-8 border border-blue-200 overflow-hidden"
          >
            <h3 className="text-2xl font-bold mb-5 text-gray-800  pb-3">
              {editingId ? "Edit Asset Details" : "New Asset Registration"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Input: Asset Name */}
              <input
                type="text"
                placeholder="Asset Name (e.g., MacBook Pro 13)"
                value={newAsset.name}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, name: e.target.value })
                }
                className="input-field"
                required
              />
              {/* Select: Type */}
              <select
                value={newAsset.type}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, type: e.target.value })
                }
                className="input-field appearance-none"
              >
                <option value="Laptop">Laptop</option>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="Headphone">Headphone</option>
                <option value="Charger">Charger</option>
                <option value="Screen">Screen</option>
                <option value="Other">Other</option>
              </select>
              {/* Input: Assigned To */}
              <input
                type="text"
                placeholder="Assigned To (e.g., Jane Doe)"
                value={newAsset.assignedTo}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, assignedTo: e.target.value })
                }
                className="input-field"
              />
              {/* Input: Serial Number */}
              <input
                type="text"
                placeholder="Serial Number"
                value={newAsset.serial}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, serial: e.target.value })
                }
                className="input-field"
                required
              />
              {/* Input: Issue Date */}
              <input
                type="date"
                placeholder="Issue Date"
                value={newAsset.purchase}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, purchase: e.target.value })
                }
                className="input-field text-gray-700 placeholder-gray-400"
              />
              {/* Input: Value */}
              <input
                type="text"
                placeholder="Value (e.g., $1200.00)"
                value={newAsset.value}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, value: e.target.value })
                }
                className="input-field"
              />
              {/* Select: Status */}
              <select
                value={newAsset.status}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, status: e.target.value })
                }
                className="input-field appearance-none"
              >
                <option value="Assigned">Assigned</option>
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              {/* Input: Note */}
              <input
                type="text"
                placeholder="Note (Optional)"
                value={newAsset.note}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, note: e.target.value })
                }
                className="input-field"
              />
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={resetForm}
                className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdateAsset : handleAddAsset}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                disabled={!newAsset.name || !newAsset.serial}
              >
                {editingId ? "Save Changes" : "Create Asset"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tailwind CSS class for all input fields in the form */}
      <style jsx global>{`
        .input-field {
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 0.5rem; /* rounded-lg */
          padding: 0.65rem 1rem;
          font-size: 0.9rem;
          color: #1f2937; /* gray-800 */
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          border-color: #3b82f6; /* blue-500 */
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); /* ring-blue-500/20 */
          outline: none;
        }
        .input-field::placeholder {
            color: #9ca3af; /* gray-400 */
        }
      `}</style>

      {/* Filters & Search - Modern Tabs & Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        {/* Modern Tabs (Pills) */}
        <div className="flex items-center space-x-2 p-1 bg-white rounded-xl shadow-inner border border-gray-200">
          {["All Assets", "Assigned", "Available", "Maintenance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition duration-200 whitespace-nowrap ${
                filter === tab
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search box & Count */}
        <div className="flex items-center gap-4 w-full sm:w-auto order-3 sm:order-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, serial, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full pl-10 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition"
              >
                <FaTimes size={10} />
              </button>
            )}
          </div>

          {/* Total count */}
          <div className="hidden sm:block text-gray-500 whitespace-nowrap text-sm font-medium">
            <strong className="text-gray-800">{filteredAssets.length}</strong> Assets Found
          </div>
        </div>
      </div>

      {/* Assets Table (Desktop) - CLEAN & MINIMALIST */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xl border border-gray-100">
        <table className="min-w-full hidden sm:table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                "frontendId",
                "name",
                "type",
                "assignedTo",
                "serial",
                "purchase",
                "value",
                "status",
              ].map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer select-none group hover:bg-gray-100 transition duration-150"
                  onClick={() =>
                    requestSort(col === "frontendId" ? "frontendId" : col)
                  }
                >
                  <span className="flex items-center">
                    {col === "frontendId"
                      ? "Asset ID"
                      : col === "assignedTo"
                      ? "Assigned To"
                      : col === "purchase"
                      ? "Issue Date"
                      : col.charAt(0).toUpperCase() + col.slice(1)}{" "}
                    {getSortIcon(col === "frontendId" ? "frontendId" : col)}
                  </span>
                </th>
              ))}
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssets.map((asset, index) => (
              <tr
                key={asset._id || asset.frontendId || index}
                className="hover:bg-blue-50/50 transition duration-150 cursor-pointer"
                onDoubleClick={() => handleRowDoubleClick(asset)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {asset.frontendId}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {asset.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${assetColors[asset.type]}`}
                  >
                    {assetIcons[asset.type]} {asset.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {asset.assignedTo || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {asset.serial}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {asset.purchase}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                  {asset.value}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowDoubleClick(asset);
                      }}
                      className="text-gray-500 hover:text-blue-600 transition p-1"
                      title="Edit Asset"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset._id);
                      }}
                      className="text-gray-500 hover:text-red-600 transition p-1"
                      title="Delete Asset"
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAssets.length === 0 && (
                <tr>
                    <td colSpan="9" className="text-center py-8 text-lg text-gray-500">
                        No assets match the current filter or search criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Cards - Modern Accordion Style */}
        <div className="sm:hidden flex flex-col gap-3 p-4">
          <AnimatePresence>
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset._id}
                className="bg-white p-4 rounded-xl shadow-md border border-gray-100 transition cursor-pointer hover:shadow-lg"
                onClick={() =>
                  setExpandedRow(expandedRow === asset._id ? null : asset._id)
                }
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                {/* Header (Always Visible) */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="font-medium">ID: {asset.frontendId}</span> | 
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${assetColors[asset.type]}`}>
                            {assetIcons[asset.type]} {asset.type}
                        </span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap mt-1 ${statusColors[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </div>

                {/* Assigned To & Value */}
                <div className="flex justify-between items-center mt-3 border-t border-gray-100 pt-3">
                  <span className="text-sm font-medium text-gray-700">
                    Assigned To: **{asset.assignedTo || "Unassigned"}**
                  </span>
                  <span className="font-bold text-lg text-blue-700">
                    {asset.value}
                  </span>
                </div>
                
                {/* Expanded Details */}
                {expandedRow === asset._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 overflow-hidden"
                  >
                    <p className="mb-1">
                      **Serial:** <span className="font-mono text-gray-800">{asset.serial}</span>
                    </p>
                    <p className="mb-1">
                      **Issue Date:** <span className="text-gray-800">{asset.purchase}</span>
                    </p>
                    <p className="mb-3">
                      **Note:** <span className="italic text-gray-700">{asset.note || "No notes."}</span>
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowDoubleClick(asset);
                        }}
                        className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                      >
                        <FaEdit size={12} className="mr-1" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAsset(asset._id);
                        }}
                        className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                      >
                        <FaTrashAlt size={12} className="mr-1" /> Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
            {filteredAssets.length === 0 && (
                <div className="text-center py-8 text-lg text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
                    No assets match the current filter or search criteria.
                </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}