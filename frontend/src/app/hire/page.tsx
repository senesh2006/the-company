"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useHireAgent } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

const hireSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(1, "Please select a role"),
  initialGoal: z.string().min(5, "Initial goal is required"),
});

type HireFormValues = z.infer<typeof hireSchema>;

export default function HirePage() {
  const router = useRouter();
  const hireAgent = useHireAgent();

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hire New Agent</h1>
        <p className="text-gray-500">Deploy a new autonomous agent into the swarm.</p>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-gray-900">
            <UserPlus className="h-5 w-5 mr-2 text-gray-500" /> Agent Details
          </CardTitle>
          <CardDescription className="text-gray-500">Configure the agent's role and initial prime directive.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Role to Hire</label>
              <Select onValueChange={(val) => {
                setValue("role", val);
                setValue("name", val); // Auto-set name to match role
              }}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Select a pre-built agent role..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                  <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Initial Goal</label>
              <Textarea 
                {...register("initialGoal")}
                placeholder="Describe the first task this agent should accomplish..."
                className="bg-white border-gray-200 text-gray-900 h-32 resize-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.initialGoal && <p className="text-red-500 text-xs">{errors.initialGoal.message}</p>}
            </div>

            <Button type="submit" disabled={hireAgent.isPending} className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-6 font-medium text-base">
              {hireAgent.isPending ? "Deploying Agent..." : "Hire & Start Agent"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
