"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useHireAgent } from "@/lib/queries";
import { useRouter } from "next/navigation";

const hireSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(1, "Please select a role"),
  goal: z.string().min(5, "Initial goal is required"),
});

type HireFormValues = z.infer<typeof hireSchema>;

export default function HirePage() {
  const router = useRouter();
  const hireAgent = useHireAgent();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<HireFormValues>({
    resolver: zodResolver(hireSchema),
  });

  const onSubmit = (data: HireFormValues) => {
    hireAgent.mutate(data, {
      onSuccess: () => {
        router.push("/agents");
      },
    });
  };

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setValue("role", role);
    setValue("name", role);
  };

  return (
    <div className="flex-1 p-md md:p-xl pb-xxl max-w-[1440px] mx-auto w-full">
      {/* Header Section */}
      <div className="mb-xl">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-xs">Hire Agents</h1>
        <p className="font-body-lg text-body-lg text-secondary max-w-2xl">Expand your AI workforce with specialized autonomous agents designed to handle complex operational workflows with precision and reliability.</p>
        
        {/* Search & Filters Row */}
        <div className="mt-lg flex flex-col md:flex-row gap-sm items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-secondary">search</span>
            <input className="w-full pl-[40px] pr-sm py-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-shadow text-body-md placeholder:text-secondary/70" placeholder="Search agents by name, skill, or department..." type="text"/>
          </div>
          <div className="flex gap-sm overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button className="whitespace-nowrap px-md py-sm rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-label-caps border border-transparent">All Departments</button>
            <button className="whitespace-nowrap px-md py-sm rounded-full bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors font-label-caps text-label-caps">Marketing</button>
            <button className="whitespace-nowrap px-md py-sm rounded-full bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors font-label-caps text-label-caps">Finance</button>
          </div>
        </div>
      </div>

      {selectedRole && (
        <div className="mb-xl bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-md">
             <h2 className="font-headline-sm text-headline-sm text-on-surface">Deploying: {selectedRole}</h2>
             <button onClick={() => setSelectedRole(null)} className="text-secondary hover:text-on-surface">
               <span className="material-symbols-outlined">close</span>
             </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Initial Goal / Directive</label>
              <textarea 
                {...register("goal")}
                placeholder="Describe the first task this agent should accomplish..."
                className="w-full p-3 bg-surface border border-outline-variant rounded-lg h-32 resize-none focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              {errors.goal && <p className="text-error text-xs">{errors.goal.message}</p>}
            </div>

            <button type="submit" disabled={hireAgent.isPending} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-lg py-3 font-semibold text-base transition-colors flex items-center gap-2">
              {hireAgent.isPending ? "Deploying..." : "Hire & Deploy Agent"}
              {!hireAgent.isPending && <span className="material-symbols-outlined">rocket_launch</span>}
            </button>
          </form>
        </div>
      )}

      {/* Featured Agents Bento */}
      <section className="mb-xxl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Featured Specialists</h2>
          <div className="flex gap-xs">
            <button className="p-[6px] rounded bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
            <button className="p-[6px] rounded bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {/* Featured Card 1 */}
          <div onClick={() => handleSelectRole("Marketing Manager")} className="md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-lg group cursor-pointer relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none"></div>
            <div className="w-full md:w-[200px] h-[160px] md:h-full rounded-lg bg-surface-container flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-6xl text-primary opacity-50">campaign</span>
            </div>
            <div className="flex-1 flex flex-col justify-center z-10">
              <div className="flex items-center gap-sm mb-xs">
                <span className="px-[8px] py-[2px] bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-[10px]">Marketing</span>
                <div className="flex items-center gap-[2px] text-primary-container">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label-caps text-label-caps">4.9</span>
                </div>
                <span className="bg-primary/10 text-primary px-[6px] py-[2px] rounded text-[10px] font-bold uppercase tracking-wider ml-auto">Top Rated</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-[4px] group-hover:text-primary transition-colors">Marketing Manager</h3>
              <p className="font-body-md text-body-md text-secondary mb-md line-clamp-2">Analyzes market trends, optimizes ad spend, and generates multivariate testing scenarios. Drives user acquisition and engagement.</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-code-sm text-code-sm text-on-surface font-semibold">$3,200 <span className="text-secondary font-normal">/ mo</span></span>
                  <span className="text-[11px] text-secondary">Compute included</span>
                </div>
                <button className="bg-surface-container-highest text-on-surface hover:bg-primary hover:text-white px-md py-sm rounded-lg font-semibold transition-colors flex items-center gap-xs">
                  Hire Now
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Featured Card 2 */}
          <div onClick={() => handleSelectRole("Finance Manager")} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow flex flex-col group cursor-pointer">
            <div className="flex items-start justify-between mb-sm">
              <div className="w-12 h-12 rounded-lg bg-tertiary-container/30 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-tertiary">account_balance</span>
              </div>
              <button className="text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined">bookmark_border</span></button>
            </div>
            <div className="mb-xs">
              <span className="px-[8px] py-[2px] border border-outline-variant text-secondary rounded-full font-label-caps text-[10px] mb-xs inline-block">Finance</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors leading-tight">Finance Manager</h3>
            </div>
            <p className="font-body-md text-body-md text-secondary mb-md text-sm line-clamp-2">Continuous anomaly detection in transaction ledgers and automated expense reporting.</p>
            <div className="mt-auto pt-md border-t border-outline-variant flex items-center justify-between">
              <span className="font-code-sm text-code-sm text-on-surface font-semibold">$1,400 <span className="text-secondary font-normal text-[11px]">/ mo</span></span>
              <button className="text-primary font-semibold text-sm hover:underline">Select</button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Layout */}
      <section>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Available Agents</h2>
          <span className="text-sm text-secondary">Showing 2 of 24</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow flex flex-col group cursor-pointer relative opacity-60">
            <div className="absolute top-md right-md">
              <div className="flex items-center gap-[2px] bg-surface-container-low px-[6px] py-[2px] rounded text-on-surface">
                <span className="material-symbols-outlined text-[12px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-label-caps text-[10px]">4.8</span>
              </div>
            </div>
            <div className="flex items-center gap-sm mb-md">
              <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary">database</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-[16px] text-on-surface leading-tight group-hover:text-primary transition-colors">Data Ingestion Pro</h3>
                <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Data Ops</span>
              </div>
            </div>
            <div className="mb-md">
              <div className="flex flex-wrap gap-xs mb-sm">
                <span className="px-[6px] py-[2px] bg-surface-container rounded text-[11px] text-secondary">ETL</span>
                <span className="px-[6px] py-[2px] bg-surface-container rounded text-[11px] text-secondary">Cleansing</span>
              </div>
              <p className="font-body-md text-sm text-secondary line-clamp-2">Automates data extraction, transformation, and loading from unstructured sources.</p>
            </div>
            <div className="mt-auto flex items-center justify-between pt-sm border-t border-outline-variant">
              <span className="font-code-sm text-code-sm text-on-surface">Coming Soon</span>
              <button disabled className="bg-surface-container border border-outline-variant text-secondary px-sm py-[4px] rounded text-sm font-semibold transition-colors">Locked</button>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
