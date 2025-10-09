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
    { value: number; label: string; color: string; icon: any }
  > = {
    STRONG_BUY: {
      value: 90,
      label: "Strong Buy",
      color: "hsl(142 76% 36%)",
      icon: TrendingUp,
    },
    BUY: {
      value: 70,
      label: "Buy",
      color: "hsl(142 76% 46%)",
      icon: TrendingUp,
    },
    NEUTRAL: {
      value: 50,
      label: "Neutral",
      color: "hsl(43 74% 66%)",
      icon: Minus,
    },
    HOLD: {
      value: 50,
      label: "Hold",
      color: "hsl(43 74% 66%)",
      icon: Minus,
    },
    SELL: {
      value: 30,
      label: "Sell",
      color: "hsl(0 84% 60%)",
      icon: TrendingDown,
    },
    STRONG_SELL: {
      value: 10,
      label: "Strong Sell",
      color: "hsl(0 84% 50%)",
      icon: TrendingDown,
    },
  };

  const recData = recommendation
    ? recommendationMap[recommendation.toUpperCase()]
    : recommendationMap["NEUTRAL"];

  const chartData = [
    {
      recommendation: recData.value,
      fill: recData.color,
    },
  ];

  const chartConfig = {
    recommendation: {
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
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {recData.value}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 8}
                          className="fill-muted-foreground text-sm"
                        >
                          {recData.label}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="recommendation"
              cornerRadius={10}
              fill={recData.color}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <div className="flex flex-col gap-2 text-sm p-6 pt-0">
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="text-base px-4 py-2"
            style={{ backgroundColor: `${recData.color}20`, color: recData.color }}
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

