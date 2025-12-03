"use client";

import React, { useState, useEffect } from "react";
// Added Loader component reference
import { Calendar, Eye, Users, FileText, Loader2 } from "lucide-react"; 
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- LOADER COMPONENT (Simple Spinner) ---
// Note: You can replace this with a more sophisticated global loading state if needed.
const Spinner = () => (
    <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="ml-3 text-indigo-500 font-medium">Loading data...</p>
    </div>
);

export default function PerformanceReports() {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const weeks = ["W1", "W2", "W3", "W4"];

  // New State for Loaders
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  
  // employees stores objects: [{ _id: "All", fullname: "All" }, { _id: "...", fullname: "..." }]
  const [employees, setEmployees] = useState([]); 
  // selectedEmployee stores the _id (either "All" or the ObjectId string)
  const [selectedEmployee, setSelectedEmployee] = useState("All"); 
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportType, setReportType] = useState("Monthly");
  const [selectedMonths, setSelectedMonths] = useState([months[currentMonthIndex]]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

// 🔄 EFFECT HOOK: Fetch Employee List on Component Mount
  useEffect(() => {
    
    const fetchEmployees = async () => {
      setIsEmployeesLoading(true);
      try {
        // Call the GET endpoint
        const res = await fetch("/api/PMSReport/allUsers", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch employee list");

        const data = await res.json();
        setEmployees(data);
        
        // Ensure "All" is selected if available, or default to the first employee
        if (data.length > 0 && selectedEmployee === "All") {
            const allOption = data.find(emp => emp._id === "All");
            setSelectedEmployee(allOption ? "All" : data[0]._id);
        }

      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setIsEmployeesLoading(false);
      }
    };
    
    fetchEmployees();
  // We suppress the warning because we only intend for this hook to run once 
  // on component mount to initialize the data and set the initial selection.
  // We rely on the *initial* value of selectedEmployee, not subsequent changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle mode switch
  const handleModeChange = (mode) => {
    setReportType(mode);
    if (mode === "Monthly") setSelectedWeeks([]);
    else setSelectedMonths([months[currentMonthIndex]]);
  };

  // Toggle month selection
  const toggleMonth = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  // Toggle week selection
  const toggleWeek = (week) => {
    setSelectedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  // Fetch performance data from API
  const handlePreview = async () => {
    setIsReportLoading(true);
    setPerformanceData([]); // Clear previous data
    
    // Convert selectedMonths to numbers (Jan = 1, Feb = 2, …)
    const monthNumbers = selectedMonths.map((month) => months.indexOf(month) + 1);

    // Convert selectedWeeks to numbers (W1 = 1, W2 = 2, …)
    const weekNumbers = selectedWeeks.map((week) =>
      parseInt(week.replace("W", ""))
    );

    const body = {
      employee: selectedEmployee,
      year: selectedYear,
      reportType: reportType,
      months: monthNumbers,
      weeks: weekNumbers,
    };

    try {
      const res = await fetch("/api/PMSReport/allUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to fetch performance data");

      const data = await res.json();
      setPerformanceData(
        data.map((user) => ({
          name: user.name,
          score: user.avgScore,
          rating: user.avgWeightedRating,
          status: user.Performance,
          action: user.Action,
        }))
      );
    } catch (err) {
      console.error("Error fetching performance:", err);
      setPerformanceData([]);
    } finally {
        setIsReportLoading(false);
    }
  };

  // Download Excel using API data
  const handleDownloadExcel = () => {
    if (performanceData.length === 0) return;

    // Find the full name of the selected employee for the report header
    const employeeDisplayName = employees.find(emp => emp._id === selectedEmployee)?.fullname || selectedEmployee;

    const headerInfo = [
      [reportType === "Monthly" ? "Monthly Team Performance Report" : "Weekly Team Performance Report"],
      // Use the display name here
      ["Employee", employeeDisplayName], 
      ["Year", selectedYear],
      ["Type", reportType],
    ];

    if (reportType === "Weekly") {
      headerInfo.push(["Month(s)", selectedMonths.join(", ")], ["Week(s)", selectedWeeks.join(", ")]);
    } else {
      headerInfo.push(["Month(s)", selectedMonths.join(", ")]);
    }

    headerInfo.push([]);

    const tableHeaders = ["Name", "Score", "Rating", "Performance", "Action"];
    const tableData = performanceData.map((row) => [
      row.name,
      row.score,
      row.rating,
      row.status,
      row.action,
    ]);

    const finalData = [...headerInfo, tableHeaders, ...tableData];
    const worksheet = XLSX.utils.aoa_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Performance_Report_${new Date().getTime()}.xlsx`);
  };

  // Determine if the preview button should be disabled
  const isPreviewDisabled = isReportLoading || isEmployeesLoading || 
                           (reportType === 'Monthly' && selectedMonths.length === 0) ||
                           (reportType === 'Weekly' && (selectedMonths.length === 0 || selectedWeeks.length === 0));

  return (
    <div className="flex justify-center py-6 bg-gray-100 min-h-screen w-full">
      <div className="flex flex-col space-y-6 w-full max-w-10xl px-4 md:px-8">
        {/* SEARCH CRITERIA CARD */}
        <div className="w-full bg-white shadow-lg rounded-3xl p-4 sm:p-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            {/* Employee Dropdown */}
            <div className="flex flex-col w-full">
              <label className="text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wide">
                Employee
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <Users className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0" />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full bg-transparent text-gray-700 text-sm focus:outline-none disabled:bg-gray-200 disabled:text-gray-500"
                  disabled={isEmployeesLoading} // Disable while loading
                >
                  {/* Show loading text or fetched options */}
                  {isEmployeesLoading ? (
                      <option value="All">Loading Employees...</option>
                  ) : (
                      employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                            {emp.fullname}
                        </option>
                      ))
                  )}
                </select>
              </div>
            </div>

            {/* Year */}
            <div className="flex flex-col w-full">
              <label className="text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wide">Year</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <Calendar className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-transparent text-gray-700 text-sm focus:outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode */}
            <div className="flex flex-col w-full">
              <label className="text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wide">Mode</label>
              <div className="flex rounded-xl bg-gray-50 p-1 shadow-inner">
                <button
                  onClick={() => handleModeChange("Monthly")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    reportType === "Monthly" ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => handleModeChange("Weekly")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    reportType === "Weekly" ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            {/* Month Dropdown for Weekly */}
            {reportType === "Weekly" && (
              <div className="flex flex-col w-full">
                <label className="text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wide">Month</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                  <Calendar className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0" />
                  <select
                    value={selectedMonths[0]}
                    onChange={(e) => setSelectedMonths([e.target.value])}
                    className="w-full bg-transparent text-gray-700 text-sm focus:outline-none"
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Multi-select Month / Week Pills */}
            <div className={`flex flex-col w-full ${reportType === "Weekly" ? "col-span-2 md:col-span-2 lg:col-span-2" : "col-span-2 md:col-span-2 lg:col-span-3"}`}>
              <label className="text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wide">
                {reportType === "Weekly" ? "Select Week" : "Select Month"}
              </label>
              <div className="flex gap-2 flex-wrap p-1 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                {(reportType === "Weekly" ? weeks : months).map((item) => (
                  <button
                    key={item}
                    onClick={() => reportType === "Weekly" ? toggleWeek(item) : toggleMonth(item)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      (reportType === "Weekly" && selectedWeeks.includes(item)) ||
                      (reportType === "Monthly" && selectedMonths.includes(item))
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6 justify-end mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handlePreview}
                disabled={isPreviewDisabled} // Disable button based on loading status or selection
                className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition ${
                  isPreviewDisabled
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {/* Show spinner when report is loading */}
                {isReportLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                    <Eye className="w-5 h-5 mr-2" />
                )}
                {isReportLoading ? 'Processing...' : 'Preview'}
              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={performanceData.length === 0 || isReportLoading}
                className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all ${
                  performanceData.length > 0 && !isReportLoading
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                <FileText className="w-5 h-5 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* REPORT CARD */}
        <div className="bg-white text-gray-900 rounded-3xl p-6 min-h-[70vh] shadow-xl">
          {/* Report Header */}
          {/* ... (Report header logic remains the same) ... */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg p-5 border border-gray-200 mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {reportType === "Monthly" ? "Monthly Team Performance Report" : "Weekly Team Performance Report"}
            </h2>

            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full font-medium shadow-sm">
                Employee: {employees.find(emp => emp._id === selectedEmployee)?.fullname || selectedEmployee}
              </span>
              <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium shadow-sm">
                Year: {selectedYear}
              </span>
              <span className="px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full font-medium shadow-sm">
                Type: {reportType}
              </span>

              {reportType === "Weekly" && selectedWeeks.length > 0 && (
                <>
                  <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-medium shadow-sm">
                    Month: {selectedMonths.join(", ")}
                  </span>
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full font-medium shadow-sm">
                    Week: {selectedWeeks.join(", ")}
                  </span>
                </>
              )}

              {reportType === "Monthly" && selectedMonths.length > 0 && (
                <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-medium shadow-sm">
                  Month: {selectedMonths.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Conditional Rendering for Loader and Data/No Data */}
          <div className="overflow-x-auto">
            {isReportLoading ? (
                <Spinner />
            ) : performanceData.length > 0 ? (
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden shadow-md">
                    <thead className="bg-indigo-600 text-white text-sm">
                        <tr>
                            <th className="py-3 px-4 text-left">Name</th>
                            <th className="py-3 px-4 text-left">Score</th>
                            <th className="py-3 px-4 text-left">Rating</th>
                            <th className="py-3 px-4 text-left">Performance</th>
                            <th className="py-3 px-4 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-800 text-sm">
                        {performanceData.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-indigo-50 transition">
                                <td className="py-3 px-4 font-medium">{row.name}</td>
                                <td className="py-3 px-4">{row.score}</td>
                                <td className="py-3 px-4">{row.rating}</td>
                                <td className="py-3 px-4">{row.status}</td>
                                <td className="py-3 px-4">{row.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="flex justify-center items-center min-h-[40vh] text-gray-500 text-lg">
                    No data to display
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}