"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { CustomerCase, CaseType, RiskLevel } from "@/types";
import { caseTypeLabel } from "@/lib/utils";

interface DashboardProps {
  cases: CustomerCase[];
}

const RISK_COLOURS: Record<RiskLevel, string> = {
  LOW:      "#34d399",
  MEDIUM:   "#fbbf24",
  HIGH:     "#fb923c",
  CRITICAL: "#f87171",
};

const TYPE_COLOURS: Record<CaseType, string> = {
  FRAUD_ALERT:  "#818cf8",
  KYC_REVIEW:   "#38bdf8",
  CREDIT_LIMIT: "#4ade80",
  AML_FLAG:     "#f472b6",
};

export function Dashboard({ cases }: DashboardProps) {
  // Case volume by type
  const typeData = (["FRAUD_ALERT", "KYC_REVIEW", "CREDIT_LIMIT", "AML_FLAG"] as CaseType[]).map(
    (type) => ({
      name:  caseTypeLabel(type),
      count: cases.filter((c) => c.caseType === type).length,
      fill:  TYPE_COLOURS[type],
    })
  );

  // Risk distribution for pie chart
  const riskData = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as RiskLevel[])
    .map((level) => ({
      name:  level,
      value: cases.filter((c) => c.riskLevel === level).length,
      fill:  RISK_COLOURS[level],
    }))
    .filter((d) => d.value > 0);

  // SLA status
  const slaBreached  = cases.filter((c) => c.slaBreached).length;
  const slaCompliant = cases.length - slaBreached;
  const slaData = [
    { name: "Compliant", value: slaCompliant, fill: "#34d399" },
    { name: "Breached",  value: slaBreached,  fill: "#f87171" },
  ].filter((d) => d.value > 0);

  if (cases.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">No active cases to display.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Case Volume by Type */}
        <div className="card lg:col-span-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Case Volume by Type
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#94a3b8" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {typeData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Risk Distribution
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={75} innerRadius={40}>
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Status */}
        <div className="card">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            SLA Status
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={slaData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} innerRadius={40}>
                {slaData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex justify-around text-center">
            <div>
              <p className="text-lg font-bold text-emerald-400">{slaCompliant}</p>
              <p className="text-xs text-slate-500">On track</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-400">{slaBreached}</p>
              <p className="text-xs text-slate-500">Breached</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="card lg:col-span-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Summary
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as RiskLevel[]).map((level) => {
              const count = cases.filter((c) => c.riskLevel === level).length;
              return (
                <div key={level} className="rounded-lg border border-border bg-surface p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: RISK_COLOURS[level] }}>{count}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{level}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}