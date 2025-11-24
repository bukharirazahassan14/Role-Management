import React, { Suspense } from "react";
import PayrollDetail from "@/app/components/PayrollDetail";

export default function PayrollPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayrollDetail />
    </Suspense>
  );
}
