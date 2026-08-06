"use client";

import { ChartOfAccountsSheet } from "@/components/finance/ChartOfAccountsSheet";

export default function FinancePage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <ChartOfAccountsSheet />
    </div>
  );
}
