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
          className="mx-auto aspect-square w-full h-[600px] [&_.recharts-pie-label-text]:fill-foreground [&_.recharts-label-line]:stroke-black [&_.recharts-label-line]:stroke-2"
        >
          <PieChart width={1500} height={1500}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value: any, name: any, props: any) => {
                const percentage = props.payload?.percentage || 0;
                return [
                  `${Number(value).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} EGP (${percentage.toFixed(1)}%)`
                ];
              }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={260}
              innerRadius={200}
              stroke="0"
              label={(entry: any) => entry.name}
              labelLine={true}
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
