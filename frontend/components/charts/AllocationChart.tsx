"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AllocationData {
  name: string;
  value: number;
  color?: string;
  id?: number;
}

interface AllocationChartProps {
  data: AllocationData[];
  title?: string;
  description?: string;
  innerRadius?: number;
  outerRadius?: number;
  onStockClick?: (stockName: string, stockId?: number) => void;
}

const COLORS = [
  "hsl(142 76% 36%)", // Primary green
  "hsl(173 58% 39%)", // Teal
  "hsl(197 37% 24%)", // Dark teal
  "hsl(43 74% 66%)", // Yellow
  "hsl(27 87% 67%)", // Orange
  "hsl(142 76% 56%)", // Light green
  "hsl(173 58% 59%)", // Light teal
  "hsl(197 37% 44%)", // Medium teal
  "hsl(43 74% 86%)", // Light yellow
  "hsl(27 87% 87%)", // Light orange
];

export function AllocationChart({
  data,
  title = "Allocation",
  description,
  innerRadius = 60,
  outerRadius = 100,
  onStockClick,
}: AllocationChartProps) {
  // Calculate total value
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Prepare chart data with colors and percentages
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || COLORS[index % COLORS.length],
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: item.color || COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as any);

  // Custom label renderer that shows symbol and percentage outside the chart
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is > 2% to avoid clutter
    if (percentage < 2) return null;

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name}: ${percentage.toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend
  const CustomLegend = () => (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {chartData.map((entry, index) => (
        <button
          key={`legend-${index}`}
          onClick={() => onStockClick?.(entry.name, entry.id)}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="text-xs font-medium">
            {entry.name}: {entry.percentage.toFixed(1)}%
          </span>
        </button>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.fill }}
                          />
                          <div>
                            <div className="font-medium">{data.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {data.value.toFixed(2)} EGP ({data.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={{
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                }}
                onClick={(data) => onStockClick?.(data.name, data.id)}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <CustomLegend />
      </CardContent>
    </Card>
  );
}
