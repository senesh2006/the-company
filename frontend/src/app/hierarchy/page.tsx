"use client";

import { useMetrics } from "@/lib/queries";

export default function HierarchyPage() {
  const { data: metrics } = useMetrics();

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden w-full">
      {/* Hierarchy Toolbar */}
      <div className="px-xl py-lg flex justify-between items-end border-b border-surface-container-high bg-surface-lowest">
        <div>
          <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface mb-1">Organizational Structure</h2>
          <p className="font-body-md text-body-md text-secondary">Manage and visualize reporting lines for human teams and AI agents.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant shadow-sm">
          <button className="px-4 py-2 bg-white rounded shadow-sm text-primary-container font-headline-sm text-headline-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            Functional
          </button>
          <button className="px-4 py-2 text-secondary hover:text-on-surface font-headline-sm text-headline-sm transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">group_work</span>
            Project Teams
          </button>
        </div>
      </div>

      {/* Hierarchy Canvas */}
      <div className="flex-1 overflow-auto p-xl relative" id="hierarchy-canvas">
        {/* Tree Line CSS applied via styled jsx or globals. We'll use inline styles or existing tailwind */}
        <style dangerouslySetInnerHTML={{__html: `
          .tree-line-h {
            position: absolute;
            height: 1px;
            background-color: #bbcabf;
            top: 50%;
            z-index: 0;
          }
          .tree-line-v {
            position: absolute;
            width: 1px;
            background-color: #bbcabf;
            left: 50%;
            z-index: 0;
          }
          .node-card {
            position: relative;
            z-index: 10;
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          .status-dot-pulse {
            position: relative;
          }
          .status-dot-pulse::before {
            content: '';
            position: absolute;
            left: 0; top: 0;
            width: 100%; height: 100%;
            background-color: inherit;
            border-radius: 50%;
            z-index: -1;
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
        `}} />

        {/* Root Node */}
        <div className="flex flex-col items-center">
          <div className="node-card bg-white border border-outline-variant rounded-lg p-md shadow-sm hover:shadow-md transition-shadow w-[280px] mb-xxl relative">
            <div className="flex justify-between items-start mb-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Executive Control</h3>
                  <p className="font-label-caps text-label-caps text-secondary uppercase">HQ Node</p>
                </div>
              </div>
              <button className="text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
            <div className="flex justify-between items-center mt-md pt-sm border-t border-surface-container-low">
              <div className="flex items-center gap-1 text-primary-container font-label-caps text-label-caps">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container status-dot-pulse"></span>
                ACTIVE
              </div>
              <button className="font-body-md text-body-md text-secondary hover:text-on-surface transition-colors">View Details</button>
            </div>
            {/* Vertical line down from root */}
            <div className="tree-line-v h-xxl bottom-[-48px]"></div>
          </div>

          {/* Level 1 Departments Container */}
          <div className="flex gap-xl relative mt-xxl pt-xxl">
            {/* Horizontal connection line for Level 1 */}
            <div className="tree-line-h w-[calc(100%-280px)] top-0"></div>
            
            {/* Department: Engineering */}
            <div className="flex flex-col items-center relative">
              <div className="tree-line-v h-xxl top-0"></div>
              <div className="node-card bg-white border border-outline-variant rounded-lg p-md shadow-sm w-[280px] mb-xl relative">
                {/* Engineering Card Content */}
                <div className="flex justify-between items-start mb-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined text-[18px]">engineering</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Engineering</h3>
                      <p className="font-label-caps text-label-caps text-secondary uppercase">Department</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-sm mb-sm text-sm text-secondary">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span className="font-body-md text-body-md">Sarah Chen (VP)</span>
                </div>
                <div className="flex justify-between items-center mt-md pt-sm border-t border-surface-container-low">
                  <div className="flex items-center gap-1 text-primary-container font-label-caps text-label-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container status-dot-pulse"></span>
                    ACTIVE
                  </div>
                </div>
                {/* Vertical line down to sub-teams */}
                <div className="tree-line-v h-xl bottom-[-32px]"></div>
              </div>

              {/* Level 2 Sub-teams (Under Engineering) */}
              <div className="flex gap-md relative mt-xl pt-xl">
                <div className="tree-line-h w-[calc(100%-240px)] top-0"></div>
                
                {/* DevOps Node */}
                <div className="flex flex-col items-center relative">
                  <div className="tree-line-v h-xl top-0"></div>
                  <div className="node-card bg-white border border-outline-variant rounded-lg p-sm shadow-sm w-[220px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">cloud</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">DevOps</h4>
                    </div>
                    <div className="space-y-2 mt-sm">
                      {/* Agent Entry */}
                      <div className="flex items-center justify-between bg-surface-bright p-xs rounded border border-surface-container-highest">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
                          <span className="font-code-sm text-code-sm text-on-surface">DataOps_Agent</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container status-dot-pulse"></span>
                      </div>
                      {/* Human Entry */}
                      <div className="flex items-center justify-between bg-surface-bright p-xs rounded border border-surface-container-highest">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-secondary">person</span>
                          <span className="font-body-md text-body-md text-on-surface">M. Davis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Backend Node */}
                <div className="flex flex-col items-center relative">
                  <div className="tree-line-v h-xl top-0"></div>
                  <div className="node-card bg-white border border-outline-variant rounded-lg p-sm shadow-sm w-[220px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">database</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">Backend</h4>
                    </div>
                    <div className="space-y-2 mt-sm">
                      <div className="flex items-center justify-between bg-surface-bright p-xs rounded border border-surface-container-highest">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
                          <span className="font-code-sm text-code-sm text-on-surface">CodeReview_Bot</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container status-dot-pulse"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department: Marketing (Simplified for structure) */}
            <div className="flex flex-col items-center relative">
              <div className="tree-line-v h-xxl top-0"></div>
              <div className="node-card bg-white border border-outline-variant rounded-lg p-md shadow-sm w-[280px] opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Marketing</h3>
                      <p className="font-label-caps text-label-caps text-secondary uppercase">Department</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-md pt-sm border-t border-surface-container-low">
                  <div className="flex items-center gap-1 text-secondary font-label-caps text-label-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-dim"></span>
                    IDLE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer Panel */}
      <div className="bg-white border-t border-outline-variant p-md flex justify-between items-center z-10 shadow-sm mt-auto">
        <div className="flex gap-xl">
          <div>
            <p className="font-label-caps text-label-caps text-secondary uppercase mb-1">Total Headcount</p>
            <div className="flex gap-md">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">person</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">142</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary-container text-[18px]">smart_toy</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">38</span>
              </div>
            </div>
          </div>
          <div className="w-px h-10 bg-outline-variant"></div>
          <div>
            <p className="font-label-caps text-label-caps text-secondary uppercase mb-1">Structure Health</p>
            <div className="flex items-center gap-sm">
              <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="w-[92%] h-full bg-primary-container"></div>
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-primary-container">92%</span>
            </div>
          </div>
        </div>
        <button className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-headline-sm text-headline-sm text-on-surface hover:bg-surface-container-high transition-colors">
          Export Structure
        </button>
      </div>
    </div>
  );
}
