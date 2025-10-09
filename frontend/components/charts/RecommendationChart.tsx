"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

interface RecommendationChartProps {
  recommendation?: string | null;
  className?: string;
}

export function RecommendationChart({
  recommendation,
  className,
}: RecommendationChartProps) {
  // Map recommendation to values and colors
  const recommendationMap: Record<
    string,
    { value: number; label: string; color: string; bgColor: string; icon: any }
  > = {
    STRONG_BUY: {
      value: 90,
      label: "Strong Buy",
      color: "#10b981", // Green
      bgColor: "#d1fae5",
      icon: TrendingUp,
    },
    BUY: {
      value: 70,
      label: "Buy",
      color: "#22c55e", // Light Green
      bgColor: "#dcfce7",
      icon: TrendingUp,
    },
    NEUTRAL: {
      value: 50,
      label: "Neutral",
      color: "#eab308", // Yellow
      bgColor: "#fef9c3",
      icon: Minus,
    },
    HOLD: {
      value: 50,
      label: "Hold",
      color: "#eab308", // Yellow
      bgColor: "#fef9c3",
      icon: Minus,
    },
    SELL: {
      value: 30,
      label: "Sell",
      color: "#f97316", // Orange
      bgColor: "#fed7aa",
      icon: TrendingDown,
    },
    STRONG_SELL: {
      value: 10,
      label: "Strong Sell",
      color: "#ef4444", // Red
      bgColor: "#fee2e2",
      icon: TrendingDown,
    },
  };

  const recData = recommendation
    ? recommendationMap[recommendation.toUpperCase()]
    : recommendationMap["NEUTRAL"];

  const chartData = [
    {
      value: recData.value,
      fill: recData.color,
    },
  ];

  const chartConfig = {
    value: {
      label: "Recommendation",
      color: recData.color,
    },
  } satisfies ChartConfig;

  const Icon = recData.icon;

  // Calculate the end angle based on recommendation value (180 degrees = 100%)
  const endAngle = 180 - (recData.value / 100) * 180;

  return (
    <Card className={className}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Analyst Recommendation</CardTitle>
        <CardDescription>Based on TradingView analysis</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-0">
        <div className="w-full h-[400px] flex items-center justify-center relative">
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={100}
            outerRadius={160}
            width={400}
            height={400}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={recData.color}
            />
            <Label
              content={() => {
                return (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-foreground"
                    style={{ color: recData.color }}
                  >
                    {recData.value}%
                  </text>
                );
              }}
            />
          </RadialBarChart>
        </div>
      </CardContent>
      <div className="flex flex-col gap-2 text-sm p-6 pt-0">
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="text-base px-4 py-2 font-semibold"
            style={{ backgroundColor: recData.bgColor, color: recData.color, borderColor: recData.color }}
          >
            <Icon className="h-4 w-4 mr-2" />
            {recData.label}
          </Badge>
        </div>
        <div className="text-center text-muted-foreground text-xs mt-2">
          Based on technical and fundamental analysis
        </div>
      </div>
    </Card>
  );
}

