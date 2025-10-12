"use client";

import { TrendingUp, TrendingDown, Minus, Sparkles, Lock } from "lucide-react";
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
    <div className={`grid gap-4 ${className}`}>
      {/* Analyst Recommendation */}
      <Card>
        <CardHeader className="items-center pb-0">
          <CardTitle>Analyst Recommendation</CardTitle>
          <CardDescription>Based on TradingView analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0">
          <div className="w-full h-[600px] flex items-center justify-center relative">
            <RadialBarChart
              data={chartData}
              startAngle={180}
              endAngle={0}
              innerRadius={200}
              outerRadius={260}
              width={1500}
              height={1500}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                fill={recData.color}
              />
            </RadialBarChart>
            {/* Score overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div 
                  className="text-8xl font-bold"
                  style={{ color: recData.color }}
                >
                  {recData.value}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="flex flex-col gap-2 text-sm p-12 pt-0">
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

      {/* AI Recommendation - Coming Soon */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
        <CardHeader className="items-center pb-0 relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendation</CardTitle>
          </div>
          <CardDescription>Powered by advanced machine learning</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-6 relative min-h-[400px]">
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Lock className="h-16 w-16 text-muted-foreground/40" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="text-sm px-4 py-1.5 border-primary/50">
                Coming Soon
              </Badge>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Powered Analysis
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Our advanced AI model is learning to provide personalized stock recommendations based on your portfolio and market trends.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Deep Learning</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span>Pattern Recognition</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <span>Sentiment Analysis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

