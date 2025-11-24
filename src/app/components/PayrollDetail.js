"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Phone,
  Target,
  User,
  CreditCard,
  ClipboardCheck,
  Loader2,
  ChevronUp,
  ChevronDown,
  MinusCircle,
  PlusCircle,
  X, // Close/Delete icon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { useToast } from "@/app/components/Toast";


// --- Configuration Options ---
const EMPLOYMENT_OPTIONS = [
  {
    value: "Full-Time",
    label: "Full-Time (40 hrs/wk)",
    description: "Standard, permanent employment status.",
  },
  {
    value: "Part-Time",
    label: "Part-Time (20 hrs/wk)",
    description: "Reduced hours employment status.",
  },
  {
    value: "Contract",
    label: "Contract (Fixed Term)",
    description: "Project-based, non-permanent employment.",
  },
];

const FREQUENCY_OPTIONS = [
  {
    value: "Monthly",
    label: "Monthly",
    description: "Payment issued once per calendar month (12 times/year).",
  },
  {
    value: "Bi-Weekly",
    label: "Bi-Weekly",
    description: "Payment issued every two weeks (26 times/year).",
  },
  {
    value: "Weekly",
    label: "Weekly",
    description: "Payment issued every week (52 times/year).",
  },
];

// Define allowance templates for initialization
const ALLOWANCE_TEMPLATES = [];

// Define deduction templates for initialization (using user's list)
const DEDUCTION_TEMPLATES = [];

// Define colors for the three major components using the requested light palette
const BASE_SALARY_COLOR = "#B0E0E6"; // Pale Aqua
const ALLOWANCE_COLOR = "#FFDAB9"; // Soft Peach
const DEDUCTION_COLOR = "#E6E6FA"; // Misty Lavender
// ----------------------------------------

// Initial State Setup
const initialCompensationData = [
  { name: "Base Salary", value: 0, type: "EARNING" },
];

// Hook to fetch user profile (using Mock Data) (Unchanged)
const useUserProfile = (userID) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userID) {
      setError("User ID is required.");
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/users/profile?userID=${userID}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch user.");
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userID]);

  return { profile, loading, error };
};

// Detail Item Component (Unchanged)
const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <Icon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
    <span className="font-medium">{label}:</span>
    <span className="font-semibold text-gray-900 truncate" title={value}>
      {value || "N/A"}
    </span>
  </div>
);
DetailItem.displayName = "DetailItem";

// User Profile Card (Unchanged)
function UserProfileCard({ profile, loading, error }) {
  const avatarColor = "bg-gradient-to-br from-indigo-500 to-purple-600";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-lg border border-gray-100 min-h-[200px] mb-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
        <span className="text-gray-600">Fetching user data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Error Loading Profile
        </h3>
        <p className="text-sm text-red-600">
          Could not retrieve user data: {error}
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(
    0
  )}`.toUpperCase();

  return (
    <div className="relative p-6 bg-white rounded-2xl shadow-2xl border border-gray-200 font-sans mb-8 overflow-hidden">
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-100 rounded-full opacity-30"></div>

      <div className="flex flex-col md:flex-row items-start md:justify-between w-full relative z-10 gap-6">
        <div className="flex items-center md:w-1/3">
          <div
            className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold text-white shadow-lg ${avatarColor}`}
          >
            {initials}
          </div>

          <div className="ml-4 md:ml-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none">
              {fullName}
            </h1>
            <h2 className="text-xl md:text-2xl font-medium text-indigo-600 mt-2">
              {profile.role?.description || "Role Not Assigned"}
            </h2>
          </div>
        </div>

        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-8 flex flex-col gap-3">
          <DetailItem icon={Mail} label="Email" value={profile.primaryEmail} />
          <DetailItem icon={Phone} label="Phone" value={profile.phone} />
          <DetailItem icon={Target} label="CNIC" value={profile.cnic} />
        </div>

        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-8 flex flex-col gap-3">
          <DetailItem
            icon={User}
            label="Acc Holder"
            value={profile.accHolderName}
          />
          <DetailItem icon={CreditCard} label="Bank" value={profile.bankName} />
          <DetailItem
            icon={ClipboardCheck}
            label="Acc No"
            value={profile.accNumber}
          />
          <DetailItem icon={ClipboardCheck} label="IBAN" value={profile.iban} />
        </div>
      </div>
    </div>
  );
}
UserProfileCard.displayName = "UserProfileCard";

// Pie Chart Component (Unchanged logic, colors updated in constants)
const CompensationPie = React.memo(({ data }) => {
  // 1. Calculate Base Salary
  const baseSalaryEntry = data.find((item) => item.name === "Base Salary");
  const baseSalaryValue = baseSalaryEntry ? baseSalaryEntry.value : 0;

  // 2. Calculate Total Allowances
  const allowancesValue = data
    .filter((item) => item.type === "ALLOWANCE" && item.enabled)
    .reduce((sum, entry) => sum + entry.value, 0);

  // 3. Calculate Total Deductions
  const deductionsValue = data
    .filter((item) => item.type === "DEDUCTION" && item.enabled)
    .reduce((sum, entry) => sum + entry.value, 0);

  // 4. Calculate Gross and Net totals
  const grossTotal = baseSalaryValue + allowancesValue;
  const netTotal = grossTotal - deductionsValue;

  // 5. Prepare data for the pie chart (representing the relative sizes of all three components)
  const pieData = [
    { name: "Base Salary", value: baseSalaryValue, color: BASE_SALARY_COLOR },
    {
      name: "Total Allowances",
      value: allowancesValue,
      color: ALLOWANCE_COLOR,
    },
    {
      name: "Total Deductions",
      value: deductionsValue,
      color: DEDUCTION_COLOR,
    },
  ].filter((item) => item.value > 0);

  // The visual sum of all slices
  const chartTotal = pieData.reduce((sum, entry) => sum + entry.value, 0);

  if (chartTotal === 0) {
    return (
      <div className="w-full h-64 md:w-72 md:h-72 flex items-center justify-center">
        <div className="relative w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center text-center text-gray-500 font-semibold border-4 border-dashed border-gray-300 p-4 shadow-inner">
          <span className="text-sm mt-1 text-gray-500">Compensation: 0</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:w-72 md:h-72 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            stroke="none"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}

            {/* Center Label: Display Net Pay (the final result) */}
            <Label
              value={`${netTotal.toLocaleString()}`}
              position="center"
              className={`font-extrabold text-2xl ${
                netTotal >= 0 ? "fill-indigo-600" : "fill-red-600"
              }`}
              dy={-5}
            />
            <Label
              value="Net Monthly Pay"
              position="center"
              className="font-medium text-sm fill-gray-500"
              dy={15}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
CompensationPie.displayName = "CompensationPie";

// --- Custom Dropdown Select Component (Unchanged) ---
const SelectInput = ({ options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    options.find((opt) => opt.value === selected) || options[0];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-white border border-gray-300 rounded-xl shadow-lg transition duration-200 hover:border-indigo-500 text-left transform hover:scale-[1.005] focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-indigo-700">
            {selectedOption.label}
          </span>
          <span className="text-sm text-gray-500 truncate">
            {selectedOption.description}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-6 h-6 text-indigo-500" />
        ) : (
          <ChevronDown className="w-6 h-6 text-indigo-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-60 w-full mt-2 bg-white border border-indigo-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto modern-scroll transform scale-[1.01] transition duration-200 ease-out origin-top">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`p-4 cursor-pointer transition duration-150 rounded-lg mx-2 my-1
                            ${
                              option.value === selected
                                ? "bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-500"
                                : "hover:bg-gray-100 text-gray-900"
                            }`}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
SelectInput.displayName = "SelectInput";

// Helper component for modern, self-contained configuration cards (Unchanged)
const ConfigCard = ({ title, content, isOpen, onClick }) => {
  const Icon = isOpen ? ChevronUp : ChevronDown;

  return (
    <div className="shadow-lg border border-gray-200 transition duration-300 hover:shadow-xl hover:border-indigo-300 rounded-xl">
      <button
        className={`w-full flex justify-between items-center p-4 bg-white hover:bg-indigo-50 text-gray-800 font-semibold transition duration-200
        ${isOpen ? "rounded-t-xl" : "rounded-xl"}
        `}
        onClick={onClick}
      >
        <span className="text-lg font-bold text-gray-900">{title}</span>
        <Icon className="w-5 h-5 text-indigo-500 transition-transform duration-300" />
      </button>
      {isOpen && (
        <div className="p-4 bg-indigo-50 border-t border-indigo-200 text-gray-700 text-sm rounded-b-xl transition-all duration-300">
          {content}
        </div>
      )}
    </div>
  );
};
ConfigCard.displayName = "ConfigCard";

// New Component: Button to Add New Item
const AddItemButton = ({ onClick, isAllowance }) => {
  const color = isAllowance ? "green" : "red";
  const label = isAllowance ? "Allowance" : "Deduction";
  const Icon = isAllowance ? PlusCircle : MinusCircle;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-3 mt-4 text-sm font-semibold
            rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.005]
            bg-${color}-500 text-white hover:bg-${color}-600 focus:outline-none
            focus:ring-4 focus:ring-${color}-300 active:bg-${color}-700`}
    >
      <Icon className="w-5 h-5" />
      Add New {label}
    </button>
  );
};
AddItemButton.displayName = "AddItemButton";

// New Component: Modal for Adding New Item
const NewItemModal = ({ isOpen, type, onClose, onSave, existingNames }) => {
  const [name, setName] = useState("");
  const [value, setValue] = useState(0);
  const [error, setError] = useState("");

  const isAllowance = type === "ALLOWANCE";
  const title = isAllowance ? "Add New Allowance" : "Add New Deduction";
  const color = isAllowance ? "green" : "red";

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setValue(0);
      setError("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const numericValue = Number(value);

    if (!trimmedName) return setError("Name is required.");
    if (existingNames.includes(trimmedName))
      return setError("Item already exists.");
    if (isNaN(numericValue) || numericValue < 0)
      return setError("Value must be non-negative.");

    try {
      const response = await fetch("/api/payroll/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: trimmedName,
          amount: numericValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      // Update local state
      onSave({ name: trimmedName, value: numericValue, type, enabled: true });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div
        className={`bg-white rounded-3xl p-6 md:p-8 w-11/12 max-w-lg shadow-[0_30px_60px_rgba(0,0,0,0.2)] border-t-4 border-${color}-500 transform transition-all duration-300 scale-100 opacity-100`}
      >
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <h3 className={`text-2xl font-extrabold text-${color}-600`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition duration-150"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 font-semibold">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="mb-4">
            <label
              htmlFor="itemName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Item Name (e.g., Travel Stipend)
            </label>
            <input
              id="itemName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder={`Custom ${
                isAllowance ? "Allowance" : "Deduction"
              } Name`}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-150 shadow-inner text-gray-900"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="itemValue"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Monthly Amount (PKR)
            </label>
            <input
              id="itemValue"
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="0"
              min="0"
              step="1"
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-150 shadow-inner text-gray-900 font-bold"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-md
                            bg-${color}-500 hover:bg-${color}-600 focus:outline-none focus:ring-2 focus:ring-${color}-300 transition duration-150`}
            >
              Save {isAllowance ? "Allowance" : "Deduction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
NewItemModal.displayName = "NewItemModal";

// Allowance Input Component (UPDATED with Delete Button)
const AllowanceInput = ({ allowance, onChange, onDelete }) => {
  const id = allowance.name.replace(/\s/g, "-").toLowerCase();

  const handleChange = (field, value) => {
    onChange(allowance.name, field, value);
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    handleChange("enabled", checked);
  };

  const handleValueChange = (e) => {
    let newValue = Number(e.target.value);
    if (isNaN(newValue) || newValue < 0) newValue = 0;
    handleChange("value", newValue);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-2 border-b border-green-200 last:border-b-0 hover:bg-white/70 rounded-lg transition duration-200">
      <label
        htmlFor={id}
        className={`flex items-center gap-3 flex-grow cursor-pointer p-2 -ml-2 rounded-lg transition duration-200
                    ${
                      allowance.enabled
                        ? "text-gray-900 font-bold"
                        : "text-gray-500"
                    }
                    hover:bg-green-100/50`}
      >
        <input
          id={id}
          type="checkbox"
          checked={allowance.enabled}
          onChange={handleCheckboxChange}
          className="h-5 w-5 rounded-md border-2 border-green-500 text-green-600 focus:ring-green-500 transition duration-150 transform hover:scale-105 shadow-md cursor-pointer checked:bg-green-600 checked:border-green-600"
        />
        <span className="text-sm font-medium">{allowance.name}</span>
      </label>

      <div className="flex items-center gap-2 w-1/3 min-w-[150px]">
        <div className="relative flex-grow">
          <input
            type="number"
            value={allowance.value || ""}
            onChange={handleValueChange}
            placeholder="0"
            min="0"
            step="1"
            disabled={!allowance.enabled}
            className={`w-full py-2 px-3 rounded-lg text-sm font-bold transition duration-150 shadow-inner
                        ${
                          allowance.enabled
                            ? "border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-green-700"
                            : "border border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500"
                        }`}
          />
        </div>
        <button
          onClick={() => onDelete(allowance.name, allowance.type)}
          className="p-1.5 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-150 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500"
          title={`Delete ${allowance.name}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
AllowanceInput.displayName = "AllowanceInput";

// Deduction Input Component (UPDATED with Delete Button)
const DeductionInput = ({ deduction, onChange, onDelete }) => {
  const id = deduction.name.replace(/\s/g, "-").toLowerCase();

  const handleChange = (field, value) => {
    onChange(deduction.name, field, value);
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    handleChange("enabled", checked);
  };

  const handleValueChange = (e) => {
    let newValue = Number(e.target.value);
    if (isNaN(newValue) || newValue < 0) newValue = 0;
    handleChange("value", newValue);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-2 border-b border-red-200 last:border-b-0 hover:bg-white/70 rounded-lg transition duration-200">
      <label
        htmlFor={id}
        className={`flex items-center gap-3 flex-grow cursor-pointer p-2 -ml-2 rounded-lg transition duration-200
                    ${
                      deduction.enabled
                        ? "text-gray-900 font-bold"
                        : "text-gray-500"
                    }
                    hover:bg-red-100/50`}
      >
        <input
          id={id}
          type="checkbox"
          checked={deduction.enabled}
          onChange={handleCheckboxChange}
          className="h-5 w-5 rounded-md border-2 border-red-500 text-red-600 focus:ring-red-500 transition duration-150 transform hover:scale-105 shadow-md cursor-pointer checked:bg-red-600 checked:border-red-600"
        />
        <span className="text-sm font-medium">{deduction.name}</span>
      </label>

      <div className="flex items-center gap-2 w-1/3 min-w-[150px]">
        <div className="relative flex-grow">
          <input
            type="number"
            value={deduction.value || ""}
            onChange={handleValueChange}
            placeholder="0"
            min="0"
            step="1"
            disabled={!deduction.enabled}
            className={`w-full py-2 px-3 rounded-lg text-sm font-bold transition duration-150 shadow-inner
                        ${
                          deduction.enabled
                            ? "border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white text-red-700"
                            : "border border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500"
                        }`}
          />
        </div>
        <button
          onClick={() => onDelete(deduction.name, deduction.type)}
          className="p-1.5 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-150 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500"
          title={`Delete ${deduction.name}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
DeductionInput.displayName = "DeductionInput";



// Payroll Config Section - Updated to pass onDelete handlers
function PayrollConfig({
  userId,
  compensationData,
  employmentType,
  setEmploymentType,
  payrollFrequency,
  setPayrollFrequency,
  selectedEmployment,
  selectedFrequency,
  onSalaryChange,
  onAllowanceChange,
  onDeductionChange,
  onAddAllowanceClick,
  onAddDeductionClick,
  onDeleteAllowance,
  onDeleteDeduction,
  addToast,
}) {
  const data = compensationData;

  // States for collapsible sections (Unchanged)
  const [openEmployment, setOpenEmployment] = useState(false);
  const [openPayroll, setOpenPayroll] = useState(false);
  const [openBasicSalary, setOpenBasicSalary] = useState(false);
  const [openAllowances, setOpenAllowances] = useState(false);
  const [openDeductions, setOpenDeductions] = useState(false);

  // --- Dynamic Title Calculation --- (Unchanged)

  const employmentTitle = openEmployment
    ? "Employment Type"
    : `Employment Type: ${selectedEmployment.label}`;

  const frequencyTitle = openPayroll
    ? "Payroll Frequency"
    : `Payroll Frequency: ${selectedFrequency.label}`;
  // ---------------------------------

  const baseSalaryItem = data.find((item) => item.name === "Base Salary");
  const currentBaseSalary = baseSalaryItem ? baseSalaryItem.value : 0;

  const [isLoading, setIsLoading] = useState(false);

const handleSubmitPayroll = async () => {

 

  try {
    setIsLoading(true);

    const baseSalaryItem = compensationData.find(item => item.name === "Base Salary");
    const basicSalary = baseSalaryItem ? baseSalaryItem.value : 0;

    const allowances = compensationData
  .filter(item => item.type === "ALLOWANCE" && item.enabled)
  .map(item => ({
    _id: item._id || undefined,  // send undefined for new items
    name: item.name,
    amount: item.value,
  }));

const deductions = compensationData
  .filter(item => item.type === "DEDUCTION" && item.enabled)
  .map(item => ({
    _id: item._id || undefined,
    name: item.name,
    amount: item.value,
  }));
  
    const payload = {
      userId,
      employmentType,
      payrollFrequency,
      basicSalary,
      allowances,
      deductions,
    };

    
    const res = await fetch("/api/payroll/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
       addToast(data.error || "Failed to save payroll setup", "error");
    } else {
      addToast(data.message || "Payroll setup saved successfully!", "success");
    }
  } catch (err) {
    console.error("Submit Payroll Error:", err);
    addToast("Something went wrong. Please try again.", "error");
  } finally {
    setIsLoading(false);
  }
};


  // Filter lists for the visualization and config section (Unchanged)
  const { allowancesList, deductionsList } = useMemo(() => {
    // Allowance list: Sort active first
    const aList = data
      .filter((item) => item.type === "ALLOWANCE")
      .sort((a, b) => {
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        return a.name.localeCompare(b.name);
      });

    // Deduction list: Sort active first
    const dList = data
      .filter((item) => item.type === "DEDUCTION")
      .sort((a, b) => {
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        return a.name.localeCompare(b.name);
      });

    return { allowancesList: aList, deductionsList: dList };
  }, [data]);

  // Local state to control the input field value as a string (Unchanged)
  const [basicSalaryInput, setBasicSalaryInput] = useState(
    String(currentBaseSalary)
  );

  // Memoize data lists for the summary legend (Unchanged)
  const { summaryEarnings, summaryDeductions, totalNetPay, totalGrossPay } =
    useMemo(() => {
      // Earnings: Base Salary (type EARNING) + Active Allowances (type ALLOWANCE, enabled, value > 0)
      const e = data.filter(
        (item) =>
          (item.type === "EARNING" && item.value > 0) ||
          (item.type === "ALLOWANCE" && item.enabled && item.value > 0)
      );
      // Deductions: Active Deductions (type DEDUCTION, enabled, value > 0)
      const d = data.filter(
        (item) => item.type === "DEDUCTION" && item.enabled && item.value > 0
      );

      const grossTotal = e.reduce((sum, entry) => sum + entry.value, 0);
      const deductionsTotal = d.reduce((sum, entry) => sum + entry.value, 0);
      const netPay = grossTotal - deductionsTotal;

      return {
        summaryEarnings: e,
        summaryDeductions: d,
        totalNetPay: netPay,
        totalGrossPay: grossTotal,
      };
    }, [data]);

  // Sync local input state when the global numerical state changes (Unchanged)
  useEffect(() => {
    const localNumericValue = Number(basicSalaryInput);
    if (localNumericValue !== currentBaseSalary && !isNaN(localNumericValue)) {
      if (localNumericValue.toString() !== currentBaseSalary.toString()) {
        setBasicSalaryInput(String(currentBaseSalary));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaseSalary]);

  const handleInputChange = useCallback(
    (e) => {
      const newValueString = e.target.value;

      // 1. Update the local string state immediately (keeps the cursor stable)
      setBasicSalaryInput(newValueString);

      // 2. Update the global numerical state
      if (newValueString === "") {
        onSalaryChange(0);
      } else {
        const numericValue = Number(newValueString);

        if (!isNaN(numericValue)) {
          onSalaryChange(numericValue);
        }
      }
    },
    [onSalaryChange]
  );

  return (
    <div className="p-8 bg-white rounded-3xl shadow-[0_20px_50px_rgba(109,40,217,0.1)] border border-gray-100 font-sans mt-8">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">
        Compensation & Payroll Configuration
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* VISUALIZATION/SUMMARY SECTION (Col 1) - Unchanged */}
        <div className="md:col-span-1 flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-inner border border-gray-200">
          <h3 className="text-xl font-bold text-indigo-700 mb-4 tracking-wider uppercase">
            Pay Structure Overview
          </h3>
          <CompensationPie data={data} />

          {/* Legend/Bottom Labels */}
          <div className="flex flex-col gap-4 mt-6 w-full">
            {/* Total Net Pay Summary */}
            <div className="w-full p-3 bg-indigo-100 rounded-lg shadow-md border border-indigo-200">
              <h4 className="text-base font-extrabold text-indigo-800 flex justify-between items-center">
                <span>Final Net Pay</span>
                <span
                  className={`text-xl ${
                    totalNetPay >= 0 ? "text-indigo-600" : "text-red-600"
                  }`}
                >
                  {totalNetPay.toLocaleString()}
                </span>
              </h4>
              <p className="text-xs text-indigo-700 mt-1">
                (Gross Earnings: {totalGrossPay.toLocaleString()} - Deductions)
              </p>
            </div>

            {/* Earnings Breakdown Section */}
            <div className="w-full">
              <h4 className="text-base font-extrabold text-green-700 border-b border-gray-200 pb-1 mb-2 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-green-500" />
                Gross Earnings Breakdown (+)
              </h4>
              {summaryEarnings.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-sm p-2 bg-white rounded-lg shadow-sm border border-gray-100 mb-1"
                >
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-3 shadow-sm"
                      style={{
                        backgroundColor:
                          entry.name === "Base Salary"
                            ? BASE_SALARY_COLOR
                            : ALLOWANCE_COLOR,
                      }}
                    ></span>
                    <span className="text-gray-700 font-medium truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-indigo-600">
                    + {entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Deductions Section */}
            <div className="w-full">
              <h4 className="text-base font-extrabold text-red-700 border-b border-gray-200 pb-1 mb-2 flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-red-500" />
                Deductions Breakdown (-)
              </h4>
              {summaryDeductions.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-sm p-2 bg-white rounded-lg shadow-sm border border-gray-100 mb-1"
                >
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-3 shadow-sm"
                      style={{ backgroundColor: DEDUCTION_COLOR }}
                    ></span>
                    <span className="text-gray-700 font-medium truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-red-600">
                    - {entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONFIGURATION SECTION (Col 2 & 3) */}
        <div className="md:col-span-2 space-y-6">
          {/* Employment Type Dropdown */}
          <ConfigCard
            title={
              openEmployment
                ? "Employment Type"
                : `Employment Type: ${selectedEmployment.label}`
            }
            isOpen={openEmployment}
            onClick={() => setOpenEmployment(!openEmployment)}
            content={
              <SelectInput
                options={EMPLOYMENT_OPTIONS}
                selected={employmentType}
                onSelect={setEmploymentType} // Updates parent state
              />
            }
          />

          {/* Payroll Frequency Dropdown */}
          <ConfigCard
            title={
              openPayroll
                ? "Payroll Frequency"
                : `Payroll Frequency: ${selectedFrequency.label}`
            }
            isOpen={openPayroll}
            onClick={() => setOpenPayroll(!openPayroll)}
            content={
              <SelectInput
                options={FREQUENCY_OPTIONS}
                selected={payrollFrequency}
                onSelect={setPayrollFrequency} // Updates parent state
              />
            }
          />
          {/* Configuration Card: Basic Salary */}
          <ConfigCard
            title={
              openBasicSalary
                ? "Basic Salary (Monthly)"
                : `Basic Salary: PKR ${currentBaseSalary.toLocaleString()}`
            }
            isOpen={openBasicSalary}
            onClick={() => setOpenBasicSalary(!openBasicSalary)}
            content={
              <div className="relative p-2">
                <label
                  htmlFor="baseSalary"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Monthly Base Salary (PKR)
                </label>
                <input
                  id="baseSalary"
                  type="text" // Use text to allow empty input gracefully
                  value={basicSalaryInput}
                  onChange={handleInputChange}
                  placeholder="Enter monthly base salary"
                  className="w-full p-4 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-150 shadow-inner text-2xl font-extrabold text-indigo-700"
                />
              </div>
            }
          />

          {/* Configuration Card: Allowances */}
          <ConfigCard
            title={`Allowances (${
              allowancesList.filter((a) => a.enabled && a.value > 0).length
            } active)`}
            isOpen={openAllowances}
            onClick={() => setOpenAllowances(!openAllowances)}
            content={
              <div className="space-y-1 bg-white p-4 rounded-xl shadow-inner border border-green-200">
                {allowancesList.map((allowance) => (
                  <AllowanceInput
                    key={allowance.name}
                    allowance={allowance}
                    onChange={onAllowanceChange}
                    onDelete={onDeleteAllowance} // Passed down
                  />
                ))}
                <AddItemButton
                  onClick={onAddAllowanceClick}
                  isAllowance={true}
                />
              </div>
            }
          />

          {/* Configuration Card: Deductions */}
          <ConfigCard
            title={`Deductions (${
              deductionsList.filter((d) => d.enabled && d.value > 0).length
            } active)`}
            isOpen={openDeductions}
            onClick={() => setOpenDeductions(!openDeductions)}
            content={
              <div className="space-y-1 bg-white p-4 rounded-xl shadow-inner border border-red-200">
                {deductionsList.map((deduction) => (
                  <DeductionInput
                    key={deduction.name}
                    deduction={deduction}
                    onChange={onDeductionChange}
                    onDelete={onDeleteDeduction} // Passed down
                  />
                ))}
                <AddItemButton
                  onClick={onAddDeductionClick}
                  isAllowance={false}
                />
              </div>
            }
          />

          {/* ✅ SUBMIT BUTTON GOES HERE */}
          <div className="w-full flex justify-end mt-10">
            <button
              onClick={handleSubmitPayroll}
              disabled={isLoading}
              className={`px-4 py-2 rounded-2xl w-65 bg-indigo-600 text-white font-extrabold text-lg tracking-wide 
            shadow-[0_4px_14px_rgba(109,40,217,0.3)]
            hover:bg-indigo-700 hover:shadow-[0_8px_20px_rgba(109,40,217,0.45)]
            active:scale-95 transition-all duration-200 flex items-center gap-3
            ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Payroll Setup
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
PayrollConfig.displayName = "PayrollConfig";

// Main Application Component
export default function PayrollDetail() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(userId);

  // Main state: an array holding all compensation components (salary, allowances, deductions)
  const [compensationData, setCompensationData] = useState(
    initialCompensationData
  );

  // State for New Item Modals
  const [isAddAllowanceModalOpen, setIsAddAllowanceModalOpen] = useState(false);
  const [isAddDeductionModalOpen, setIsAddDeductionModalOpen] = useState(false);

  // PayrollDetail.js
  const [employmentType, setEmploymentType] = useState(
    EMPLOYMENT_OPTIONS[0].value
  );
  const [payrollFrequency, setPayrollFrequency] = useState(
    FREQUENCY_OPTIONS[0].value
  );

  // Memoize selected option objects for display
  const selectedEmployment = useMemo(
    () => EMPLOYMENT_OPTIONS.find((o) => o.value === employmentType),
    [employmentType]
  );

  const selectedFrequency = useMemo(
    () => FREQUENCY_OPTIONS.find((o) => o.value === payrollFrequency),
    [payrollFrequency]
  );

  // Helper to get all existing names for validation
  const existingNames = useMemo(
    () => compensationData.map((item) => item.name),
    [compensationData]
  );

  const [payroll, setPayroll] = useState({
    basicSalary: 0,
    grossSalary: 0,
    netAmount: 0,
    allowances: [],
    deductions: [],
    employmentType: "",
    payrollFrequency: "",
  });

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        console.log("📌 Calling payroll API...");

        const res = await fetch(`/api/payroll?userID=${userId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch payroll data");

        const data = await res.json();
        console.log("🔥 API Response (Payroll):", data);

        const apiAllowances = Array.isArray(data.allowances)
          ? data.allowances.map((a) => ({
              _id: a._id || a.id || null, 
              name: a.name,
              value: Number(a.amount) || 0,
              enabled: a.amount > 0,
              type: "ALLOWANCE",
            }))
          : [];
            

        const apiDeductions = Array.isArray(data.deductions)
          ? data.deductions.map((d) => ({
              _id: d._id || d.id || null,
              name: d.name,
              value: Number(d.amount) || 0,
              enabled: d.amount > 0,
              type: "DEDUCTION",
            }))
          : [];

        const mergedData = [
          {
            name: "Base Salary",
            value: data.basicSalary || 0,
            type: "EARNING",
          },
          ...apiAllowances,
          ...apiDeductions,
        ];

        setCompensationData(mergedData);

        setPayroll({
          basicSalary: data.basicSalary || 0,
          grossSalary: data.grossSalary || 0,
          netAmount: data.netAmount || 0,
          allowances: apiAllowances,
          deductions: apiDeductions,
          employmentType: data.employmentType || "",
          payrollFrequency: data.payrollFrequency || "",
        });

        // ✅ Bind API values to dropdowns
        if (data.employmentType) setEmploymentType(data.employmentType);
        if (data.payrollFrequency) setPayrollFrequency(data.payrollFrequency);
      } catch (err) {
        console.error("❌ Payroll API Error:", err);
      }
    };

    fetchPayroll();
  }, [userId]);

  // --- CRUD Handlers ---

  // 1. Update Base Salary
  const handleSalaryChange = useCallback((newValue) => {
    setCompensationData((prevData) =>
      prevData.map((item) =>
        item.name === "Base Salary" ? { ...item, value: newValue } : item
      )
    );
  }, []);

  // 2. Update Allowance Item (value or enabled status)
  const handleAllowanceChange = useCallback((name, field, value) => {
    setCompensationData((prevData) =>
      prevData.map((item) =>
        item.name === name && item.type === "ALLOWANCE"
          ? { ...item, [field]: value }
          : item
      )
    );
  }, []);

  // 3. Update Deduction Item (value or enabled status)
  const handleDeductionChange = useCallback((name, field, value) => {
    setCompensationData((prevData) =>
      prevData.map((item) =>
        item.name === name && item.type === "DEDUCTION"
          ? { ...item, [field]: value }
          : item
      )
    );
  }, []);

  // 4. Add new custom item (from modal)
  const handleAddItem = useCallback((newItem) => {
    setCompensationData((prevData) => [...prevData, newItem]);
    console.log(`Added new item: ${newItem.name}`);
  }, []);

  // 5. Delete item (NEW HANDLER)
  const handleDeleteItem = useCallback((name, type) => {
    if (name === "Base Salary" && type === "EARNING") {
      // Safety check: prevent deleting the core salary item
      console.warn("Base Salary cannot be deleted.");
      return;
    }

    setCompensationData((prevData) =>
      // Filter out the specific item by name and type
      prevData.filter((item) => !(item.name === name && item.type === type))
    );
    console.log(`Deleted item: ${name} (${type})`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 md:p-12 font-inter">
      <style jsx global>{`
        /* Modern scrollbar styling for better aesthetic */
        .modern-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .modern-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1; /* gray-300 */
          border-radius: 4px;
        }
        .modern-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8; /* gray-400 */
        }
        .modern-scroll::-webkit-scrollbar-track {
          background-color: #f1f5f9; /* gray-100 */
          border-radius: 4px;
        }
      `}</style>
      <div className="max-w-8xl mx-auto">
        {/* Header and Profile */}
        <UserProfileCard
          profile={profile}
          loading={profileLoading}
          error={profileError}
        />

        {/* Payroll Configuration and Visualization */}
        <PayrollConfig
          userId={userId}
          compensationData={compensationData}
          employmentType={employmentType}
          setEmploymentType={setEmploymentType}
          payrollFrequency={payrollFrequency}
          setPayrollFrequency={setPayrollFrequency}
          selectedEmployment={selectedEmployment}
          selectedFrequency={selectedFrequency}
          onSalaryChange={handleSalaryChange}
          onAllowanceChange={handleAllowanceChange}
          onDeductionChange={handleDeductionChange}
          onAddAllowanceClick={() => setIsAddAllowanceModalOpen(true)}
          onAddDeductionClick={() => setIsAddDeductionModalOpen(true)}
          onDeleteAllowance={handleDeleteItem}
          onDeleteDeduction={handleDeleteItem}
          addToast={addToast}
        />

        {/* Modals */}
        <NewItemModal
          isOpen={isAddAllowanceModalOpen}
          type="ALLOWANCE"
          onClose={() => setIsAddAllowanceModalOpen(false)}
          onSave={handleAddItem}
          existingNames={existingNames}
        />
        <NewItemModal
          isOpen={isAddDeductionModalOpen}
          type="DEDUCTION"
          onClose={() => setIsAddDeductionModalOpen(false)}
          onSave={handleAddItem}
          existingNames={existingNames}
        />
      </div>
    </div>
  );
}
