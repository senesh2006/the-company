"use client";

import React from "react";
import { TableProps, TablePropsSchema } from "@/lib/agent-ui/schema";

export { TablePropsSchema };
export type { TableProps };

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-slate-400 italic"
                >
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col) => {
                    const val = row[col.key];
                    const displayVal =
                      val === null || val === undefined
                        ? "—"
                        : typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val);

                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap"
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
