"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function UsageChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6e60ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6e60ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#fafafa" }}
            itemStyle={{ color: "#6e60ee" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6e60ee"
            strokeWidth={2}
            fill="url(#usageFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
