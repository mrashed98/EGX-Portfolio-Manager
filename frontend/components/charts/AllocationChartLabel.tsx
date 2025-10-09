"use client";

import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart";

interface AllocationData {
  name: string;
  value: number;
  color?: string;
  id?: number;
}

interface AllocationChartLabelProps {
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

export function AllocationChartLabel({
  data,
  title = "Allocation",
  description,
  innerRadius = 60,
  outerRadius = 100,
  onStockClick,
}: AllocationChartLabelProps) {
  // Calculate total value
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Prepare chart data with colors and percentages
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || COLORS[index % COLORS.length],
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  // Create chart config for shadcn charts
  const chartConfig = {
    value: {
      label: "Value",
    },
    ...data.reduce((acc, item, index) => {
      acc[item.name] = {
        label: item.name,
        color: item.color || COLORS[index % COLORS.length],
      };
      return acc;
    }, {} as any),
  } satisfies ChartConfig;

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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(2)} EGP`, 
                name
              ]}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              stroke="0"
              label={renderCustomLabel}
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
