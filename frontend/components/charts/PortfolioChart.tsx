"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PortfolioChartProps {
  data: Array<{
    date: string;
    value: number;
    [key: string]: any;
  }>;
  title?: string;
  description?: string;
  type?: "line" | "area";
  dataKey?: string;
  height?: number;
}

export function PortfolioChart({
  data,
  title = "Portfolio Value",
  description,
  type = "area",
  dataKey = "value",
  height = 300,
}: PortfolioChartProps) {
  const chartConfig = {
    [dataKey]: {
      label: title,
      color: "hsl(var(--chart-1))",
    },
  };

  // Check if we should render with Card wrapper or just the chart
  const hasTitle = title && title !== "";
  
  const chartElement = (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      {type === "area" ? (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value: any) => [`${Number(value).toFixed(2)} EGP`, 'Value']}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      ) : (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value: any) => [`${Number(value).toFixed(2)} EGP`, 'Value']}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      )}
    </ChartContainer>
  );

  // If no title/description, return just the chart (for use inside Card)
  if (!hasTitle && !description) {
    return chartElement;
  }

  // Otherwise, render with Card wrapper
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {chartElement}
      </CardContent>
    </Card>
  );
}

