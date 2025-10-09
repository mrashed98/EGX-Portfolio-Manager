"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

interface TrendSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function TrendSparkline({
  data,
  color = "hsl(var(--primary))",
  width = 100,
  height = 30,
}: TrendSparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

