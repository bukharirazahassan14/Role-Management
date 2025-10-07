// src/components/StaffDashboard.js (or wherever your main page component is)

import { Smile } from 'lucide-react';

// Assuming you have a way to get the staff user's name, e.g., from context or props.
// For this example, we'll use a placeholder name.
const STAFF_USER_NAME = "Alex Johnson"; 

export default function StaffDashboard() {
  return (
    // Main container takes full width/height and centers content
    <div className="flex flex-col flex-1 p-8 bg-gray-50 min-h-screen">
      
      {/* Container for the main welcome card/area */}
      <div className="flex-grow flex items-center justify-center">
        
        {/* Modern Welcome Card/Panel */}
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-10 md:p-16 border border-gray-100 text-center transition-all duration-500 hover:shadow-3xl hover:scale-[1.005]">
          
          {/* Icon for a welcoming feel */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-100 rounded-full inline-block shadow-lg">
              <Smile className="h-10 w-10 text-indigo-600" />
            </div>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Welcome Back, {STAFF_USER_NAME}!
          </h1>
          
          {/* Subtitle/Greeting */}
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-8">
            Your personalized staff dashboard is ready. Let&apos;s make this a productive day.
          </p>

          {/* Simple Call to Action (Example only) */}
          <button
            className="px-8 py-3 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-500/50 
                       hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
          >
            View Your Weekly Evaluation
          </button>
        </div>
      </div>

      {/* Optional: Footer or status bar for the bottom */}
      <footer className="text-center text-sm text-gray-400 mt-8">
        App Status: All systems operational.
      </footer>
    </div>
  );
}