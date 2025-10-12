"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
  Label,
} from "recharts";
import { getChartColor } from "@/lib/design-tokens";
import { formatPercent } from "@/lib/formatters";

interface RiskReturnData {
  name: string;
  return: number;      // % return
  risk: number;        // volatility
  value: number;       // portfolio value
}

interface RiskReturnScatterProps {
  data: RiskReturnData[];
  title?: string;
  description?: string;
}

export function RiskReturnScatter({
  data,
  title = "Risk vs Return",
  description = "Portfolio risk-return profile",
}: RiskReturnScatterProps) {
  // Transform data for scatter chart
  const chartData = data.map((item, index) => ({
    ...item,
    risk: item.risk * 100, // Convert to percentage
    fill: getChartColor(index),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Return:</span>
            <span className="font-medium">{formatPercent(data.return, 2, true)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Risk:</span>
            <span className="font-medium">{formatPercent(data.risk, 2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">{data.value.toFixed(0)} EGP</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomLabel = (props: any) => {
    const { x, y, payload } = props;
    
    return (
      <text
        x={x}
        y={y - 15}
        textAnchor="middle"
        fill="currentColor"
        className="text-xs font-medium"
      >
        {payload.name}
      </text>
    );
  };

  // Calculate efficient frontier reference line (simplified)
  const maxReturn = Math.max(...chartData.map((d) => d.return));
  const minRisk = Math.min(...chartData.map((d) => d.risk));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="risk"
                name="Risk"
                unit="%"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              >
                <Label
                  value="Risk (Volatility %)"
                  position="insideBottom"
                  offset={-10}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
              </XAxis>
              <YAxis
                type="number"
                dataKey="return"
                name="Return"
                unit="%"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              >
                <Label
                  value="Return %"
                  position="insideLeft"
                  angle={-90}
                  offset={-10}
                  style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }}
                />
              </YAxis>
              <ZAxis
                type="number"
                dataKey="value"
                range={[400, 1200]}
                name="Value"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={chartData} label={<CustomLabel />}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Quadrant Legend */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
              <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
                High Return, Low Risk
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Optimal portfolios (top-left quadrant)
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                High Return, High Risk
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Aggressive portfolios (top-right quadrant)
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Low Return, Low Risk
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Conservative portfolios (bottom-left quadrant)
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">
                Low Return, High Risk
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Suboptimal portfolios (bottom-right quadrant)
              </p>
            </div>
          </div>

          {/* Interpretation */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Analysis:</strong> Larger bubbles represent portfolios with higher total values.
              The ideal portfolio achieves high returns with low volatility (top-left area).
              Consider rebalancing portfolios in the bottom-right quadrant.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

