"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Full "Aug 1, 2026"-style dates (formatDate in lib/utils) are too wide for
// the x-axis at any tick density — short-form here instead, and fewer ticks
// on narrow screens so labels don't collide on a 320-375px phone.
function formatTick(date: ReactNode) {
  if (typeof date !== "string") return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(date),
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function UsageChart({ data }: { data: { date: string; count: number }[] }) {
  const isMobile = useIsMobile();

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6e60ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6e60ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={isMobile ? 6 : 4}
            minTickGap={isMobile ? 16 : 8}
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
            labelFormatter={formatTick}
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
