"use client";

import React, { useState, useMemo } from 'react'; 
// ADDED: Import useRouter for Next.js routing
import { useRouter } from 'next/navigation'; 
import { 
  Eye, 
  Pencil, 
  Trash2, 
  Settings, 
  DollarSign, 
  Wallet, 
  ArrowUp, 
  ArrowDown, 
  CalendarCheck,
  Search,           
  ChevronLeft,      
  ChevronRight,
  Briefcase,        
  Clock             
} from "lucide-react";

// --- Data Model ---
const initialPayrolls = [
    { fullName: "Hassan Bukhari", role: "HR Manager", type: "Permanent", payrollCycle: "Monthly", basicSalary: 150000, allowances: 0, deductions: 0, netAmount: 150000 },
    { fullName: "Ali Khan", role: "Staff Accountant", type: "Internee", payrollCycle: "Bi-Weekly", basicSalary: 120000, allowances: 10000, deductions: 2000, netAmount: 128000 },
    { fullName: "Sara Ahmed", role: "Management Executive", type: "Permanent", payrollCycle: "Monthly", basicSalary: 200000, allowances: 20000, deductions: 5000, netAmount: 215000 },
    { fullName: "Fatima Noor", role: "HR Specialist", type: "Contract", payrollCycle: "Semi-Monthly", basicSalary: 140000, allowances: 5000, deductions: 1500, netAmount: 143500 },
    { fullName: "David Lee", role: "Developer", type: "Permanent", payrollCycle: "Monthly", basicSalary: 180000, allowances: 15000, deductions: 3000, netAmount: 192000 },
    { fullName: "Emily Chen", role: "Marketing Lead", type: "Permanent", payrollCycle: "Monthly", basicSalary: 160000, allowances: 12000, deductions: 2500, netAmount: 169500 },
    { fullName: "Michael Johnson", role: "Sales Rep", type: "Permanent", payrollCycle: "Monthly", basicSalary: 110000, allowances: 8000, deductions: 1000, netAmount: 117000 },
    { fullName: "Jessica Williams", role: "Operations Analyst", type: "Contract", payrollCycle: "Bi-Weekly", basicSalary: 135000, allowances: 9000, deductions: 1800, netAmount: 142200 },
    // More records for pagination testing
    { fullName: "Robert Brown", role: "HR Coordinator", type: "Internee", payrollCycle: "Monthly", basicSalary: 95000, allowances: 5000, deductions: 1000, netAmount: 99000 },
    { fullName: "Laura Davis", role: "Financial Controller", type: "Permanent", payrollCycle: "Monthly", basicSalary: 220000, allowances: 25000, deductions: 6000, netAmount: 239000 },
    { fullName: "Chris Wilson", role: "Data Scientist", type: "Contract", payrollCycle: "Semi-Monthly", basicSalary: 190000, allowances: 18000, deductions: 4000, netAmount: 204000 },
    { fullName: "Amanda Martinez", role: "Product Manager", type: "Permanent", payrollCycle: "Monthly", basicSalary: 175000, allowances: 14000, deductions: 3500, netAmount: 185500 },
];

// --- Helper Components ---

const DetailRow = ({ icon: Icon, label, amount, color, isPositive, isNegative }) => (
  <div className="flex items-center justify-between">
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <span className={`font-medium ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-800'}`}>
        Rs. {amount.toLocaleString()}
    </span>
  </div>
);

// MODIFIED: ActionButton to accept a custom title and an onClick handler
const ActionButton = ({ icon: Icon, color, title, onClick }) => (
    <button 
        className={`p-2 rounded-lg ${color} bg-white hover:bg-gray-100 transition-colors duration-200 border border-gray-200 shadow-sm hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-indigo-300`}
        // Use the passed title for a meaningful tooltip
        title={title || Icon.name} 
        // Pass the onClick handler
        onClick={onClick}
    >
        <Icon className="w-4 h-4" />
    </button>
);

const DashboardHeader = ({ searchTerm, setSearchTerm }) => (
    <div className="flex justify-end mb-8">
        <div className="relative w-full max-w-sm">
            <input 
                type="text" 
                placeholder="Search employees by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-4 pr-12 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                <Search className="w-5 h-5" />
            </div>
        </div>
    </div>
);

const ModernPagination = ({ currentPage, totalPages, totalRecords, recordsPerPage, setCurrentPage }) => {
    const startRecord = (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

    const renderPageNumbers = () => {
        const pages = [];
        const maxPages = 5;
        
        if (totalPages <= maxPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 2) pages.push('...');
            if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
            if (currentPage < totalPages - 1) pages.push('..');
            pages.push(totalPages);
        }
        
        return pages.filter((value, index, self) => {
            return self.indexOf(value) === index || (typeof value === 'string' && self[index - 1] !== value);
        }).map((page, index) => {
            if (typeof page === 'string') {
                return <span key={index} className="px-3 py-1 text-sm text-gray-500">...</span>;
            }
            return (
                <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    {page}
                </button>
            );
        });
    };
    
    return (
        <div className="flex justify-between items-center mt-10">
            {/* Left Side: Record Count */}
            <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{startRecord}</span> to <span className="font-semibold">{endRecord}</span> of <span className="font-semibold">{totalRecords}</span> results
            </div>
            
            {/* Right Side: Reduced Width Pagination Controls */}
            <div className="flex justify-end w-full max-w-sm">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-xl shadow-lg border border-gray-100">
                    {/* Previous Button */}
                    <button 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                        {renderPageNumbers()}
                    </div>

                    {/* Next Button */}
                    <button 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function PayrollUsersUI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8; 
  
  // ADDED: Initialize the router
  const router = useRouter();

  // ADDED: Define the specific routing handler for the Settings button
  const handleSettingsClick = () => {
    router.push('/main/payrollsetupdetail');
  };

  // 1. Filtering Logic
  const filteredPayrolls = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return initialPayrolls.filter(user => 
      user.fullName.toLowerCase().includes(lowerCaseSearch) ||
      user.role.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

  // 2. Pagination Calculation
  const totalRecords = filteredPayrolls.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  // Safely adjust currentPage if it's out of bounds after filtering
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);


  // 3. Slicing Logic
  const paginatedPayrolls = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredPayrolls.slice(startIndex, endIndex);
  }, [filteredPayrolls, currentPage]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* 1. Header with Search Box */}
      <DashboardHeader 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
      />
      
      {/* 2. Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedPayrolls.length > 0 ? (
            paginatedPayrolls.map((user, i) => {
            const grossSalary = user.basicSalary + user.allowances;

            return (
                <div
                key={i}
                className="group relative flex flex-col bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-1"
                >
                {/* Header / Avatar Section */}
                <div className="p-6 pb-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    
                    <div className="flex items-start">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                            <span className="text-xl font-bold text-white">{user.fullName.charAt(0)}</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="ml-4 mt-1">
                        <h3 className="text-xl font-bold text-gray-900">{user.fullName}</h3>
                        <p className="text-sm text-indigo-600 font-medium">{user.role}</p>
                    </div>
                    </div>
                </div>

                {/* --- REFINED: Employment and Payroll Type Block --- */}
                <div className="px-6 -mt-10 mb-4 z-10">
                    <div className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-gray-200 shadow-md divide-x divide-gray-200">
                        {/* Employment Type */}
                        <div className="flex-1 flex flex-col items-center gap-1 pr-2">
                            <Briefcase className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-medium text-gray-500">Employment</span>
                            <span className="font-semibold text-gray-800 text-sm">{user.type}</span>
                        </div>
                        
                        {/* Payroll Type */}
                        <div className="flex-1 flex flex-col items-center gap-1 pl-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-medium text-gray-500">Payroll Cycle</span>
                            <span className="font-semibold text-gray-800 text-sm">{user.payrollCycle}</span>
                        </div>
                    </div>
                </div>


                {/* Payroll Details - Net Salary Highlight with Sidebar Gradient */}
                <div className="px-6 mb-4 z-10">
                    <div className={`
                        bg-gradient-to-b from-gray-950/90 to-indigo-800/90 
                        backdrop-blur-sm border border-white/50 
                        text-white/90 p-4 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300
                    `}>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-white/80" />
                            <span className="text-sm font-light uppercase">Net Salary</span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight text-white">
                            Rs. {user.netAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="p-6 pt-2 text-gray-700 space-y-3 text-sm">
                    
                    <DetailRow icon={DollarSign} label="Basic Salary" amount={user.basicSalary} color="text-gray-600" />
                    <DetailRow icon={ArrowUp} label="Allowances" amount={user.allowances} color="text-emerald-500" isPositive={true} />
                    
                    {/* Separator for Gross */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-gray-500" />
                            <span>Gross Salary</span>
                        </div>
                        <span>Rs. {grossSalary.toLocaleString()}</span>
                    </div>

                    <DetailRow icon={ArrowDown} label="Deductions" amount={user.deductions} color="text-red-500" isNegative={true} />
                </div>

                {/* Footer / Actions (Uses ActionButton component with enhanced hover) */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                    <ActionButton icon={Eye} color="text-blue-500" title="View Details" />
                    <ActionButton icon={Pencil} color="text-yellow-500" title="Edit Payroll" />
                    {/* ATTACHED ROUTING: Call handleSettingsClick on click */}
                    <ActionButton 
                        icon={Settings} 
                        color="text-green-500" 
                        title="Payroll Setup Detail" 
                        onClick={handleSettingsClick}
                    />
                    <ActionButton icon={Trash2} color="text-red-500" title="Delete Payroll" />
                </div>
                </div>
            );
            })
        ) : (
             <p className="col-span-4 text-center text-gray-500 py-10">No payroll records found matching your search term.</p>
        )}
      </div>

      {/* 3. Pagination */}
      {totalRecords > 0 && (
        <ModernPagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalRecords={totalRecords}
            recordsPerPage={recordsPerPage}
            setCurrentPage={setCurrentPage}
        />
      )}

    </div>
  );
}