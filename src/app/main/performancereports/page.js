// src/app/main/performancereports/page.js

import React, { Suspense } from "react";
import PerformanceReports from "@/app/components/PerformanceReports";

export default function PerformanceReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PerformanceReports />
    </Suspense>
  );
}
