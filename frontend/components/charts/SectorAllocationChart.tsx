"use client";

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SectorAllocation {
  sector: string;
  allocation_percent: number;
  stock_count: number;
  avg_change_percent: number;
  stocks: any[];
}

interface SectorAllocationChartProps {
  data: SectorAllocation[];
  title?: string;
  description?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
];

export function SectorAllocationChart({ 
  data, 
  title = "Sector Allocation",
  description = "Portfolio distribution by sector"
}: SectorAllocationChartProps) {
  // Transform data for bubble chart
  // x-axis: index/position (for spreading)
  // y-axis: allocation percentage
  // z-axis (bubble size): stock count
  const chartData = data.map((item, index) => ({
    x: index,
    y: item.allocation_percent,
    z: item.stock_count * 100, // Scale for better bubble visibility
    name: item.sector,
    allocation: item.allocation_percent,
    stockCount: item.stock_count,
    fill: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <div className="space-y-1">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm text-muted-foreground">
              Allocation: {(data.allocation || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Stocks: {data.stockCount}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, payload } = props;
    
    // Check if payload exists and has required properties
    if (!payload || typeof payload.z === 'undefined' || payload.z < 200) {
      return <g></g>;
    }

    return (
      <text
        x={cx}
        y={cy}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {payload.name || 'Unknown'}
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No sector data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate ranges for better axis display
  const maxAllocation = Math.max(...data.map(d => d.allocation_percent));
  const minAllocation = Math.min(...data.map(d => d.allocation_percent));
  const yAxisDomain = [Math.max(0, minAllocation - 5), maxAllocation + 5];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="category"
              dataKey="name"
              name="Sector"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Allocation"
              unit="%"
              domain={yAxisDomain}
              tick={{ fontSize: 12 }}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[400, 2000]}
              name="Stock Count"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              data={chartData}
              shape="circle"
              label={renderCustomizedLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {chartData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name} ({entry.stockCount})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

