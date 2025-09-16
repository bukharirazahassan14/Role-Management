import React, { forwardRef } from "react";

const Report = forwardRef(({ evaluation, user, evaluationPrograms }, ref) => {
  // Get data from localStorage
  const userName =
    typeof window !== "undefined" ? localStorage.getItem("userName") : null;
  
  return (
    <div
      ref={ref}
      className="p-10 bg-white text-gray-900 w-[210mm] h-[297mm] mx-auto shadow-xl font-sans"
    >
      {/* Top Info Row */}
      <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
        <p>{new Date().toLocaleDateString()}</p>
        <p>
          Printed by:{" "}
          <span className="font-medium text-gray-700">
            {userName || "N/A"}
          </span>
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-wide text-gray-800">
          Weekly Evaluation Report
        </h1>
        <p className="mt-3 text-lg font-semibold text-gray-700">
          Review Period:{" "}
          {evaluation?.weekStart
            ? new Date(evaluation.weekStart).toLocaleDateString()
            : "N/A"}{" "}
          –{" "}
          {evaluation?.weekEnd
            ? new Date(evaluation.weekEnd).toLocaleDateString()
            : "N/A"}
        </p>
        <p className="mt-1 text-lg font-semibold text-indigo-600">
          {evaluation?.weekNumber ? `Week ${evaluation.weekNumber}` : "N/A"}
        </p>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-2 gap-6 mb-10 bg-gray-50 p-5 rounded-lg shadow-sm">
        <p>
          <span className="font-semibold">Name:</span> {user?.fullName}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {user?.email}
        </p>
        
      </div>

      {/* Programs / KPIs */}
      <div className="mb-10">
        
        <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden shadow-md">
          <thead className="bg-indigo-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left"> Evaluation Programs</th>
              <th className="px-4 py-2">Weightage</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Weighted Rating</th>
            </tr>
          </thead>
          <tbody>
            {evaluationPrograms?.map((program, i) => {
              const scoreData = evaluation?.scores?.find(
                (s) => s.kpiId === program._id
              );

              return (
                <React.Fragment key={program._id}>
                  {/* Main Row */}
                  <tr
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {program.Name}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {program.Weightage}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {scoreData?.score ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {scoreData?.weightedRating ?? "-"}
                    </td>
                  </tr>

                  {/* Description Row */}
                  <tr
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td
                      colSpan={4}
                      className="px-4 pb-3 text-gray-600 text-sm italic whitespace-pre-wrap"
                    >
                      {program.Description || "—"}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end space-x-10 text-base font-semibold">
          <p>Total Score: {evaluation?.totalScore}</p>
          <p>Total Weighted Rating: {evaluation?.totalWeightedRating}</p>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Comments</h2>
        <p className="text-gray-700 italic">
          {evaluation?.comments || "No comments provided."}
        </p>
      </div>
    </div>
  );
});

Report.displayName = "Report";

export default Report;
