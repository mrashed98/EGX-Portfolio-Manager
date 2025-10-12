"use client";

import { Treemap, ResponsiveContainer, Tooltip, Scatter, ScatterChart, XAxis, YAxis, ZAxis, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  onStockClick,
}: AllocationChartProps) {
  // Calculate total value
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Prepare data structure based on chart type
  const isSectorChart = title === "Sector Allocation";
  
  const treeData = data.map((item, index) => ({
    name: item.name,
    size: item.value,
    fill: item.color || COLORS[index % COLORS.length],
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    id: item.id,
  }));

  // Prepare bubble chart data for sectors with better positioning
  const bubbleData = isSectorChart ? data.map((item, index) => {
    // Sort by value to position largest bubbles in center
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const sortedIndex = sortedData.findIndex(d => d.name === item.name);
    
    // Create more natural positioning for packed bubbles
    const angle = (sortedIndex / data.length) * 2 * Math.PI;
    const radius = sortedIndex === 0 ? 0 : 20 + (sortedIndex % 3) * 15; // Center largest, others around
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    
    return {
      x: x,
      y: y,
      z: Math.max(100, percentage * 10), // Much larger bubbles, scaled by percentage
      name: item.name,
      value: item.value,
      fill: item.color || COLORS[index % COLORS.length],
      percentage: percentage,
      id: item.id,
    };
  }) : [];

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, size, fill, percentage } = props;
    
    // Don't render very small rectangles
    if (width < 40 || height < 40) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill,
            stroke: '#fff',
            strokeWidth: 2,
            cursor: 'pointer',
          }}
          onClick={() => {
            const item = treeData.find(d => d.name === name);
            onStockClick?.(name, item?.id);
          }}
          className="hover:opacity-80 transition-opacity"
        />
        {width > 60 && height > 60 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={14}
              fontWeight="bold"
            >
              {name}
            </text>
             <text
               x={x + width / 2}
               y={y + height / 2 + 10}
               textAnchor="middle"
               fill="#fff"
               fontSize={12}
             >
               {(percentage || 0).toFixed(1)}%
             </text>
             <text
               x={x + width / 2}
               y={y + height / 2 + 28}
               textAnchor="middle"
               fill="#fff"
               fontSize={11}
               opacity={0.9}
             >
               {(size || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP
             </text>
          </>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <div className="space-y-1">
            <p className="font-semibold">{data.name}</p>
             <p className="text-sm text-muted-foreground">
               Value: {(data.size || data.value || 0).toLocaleString('en-US', { 
                 minimumFractionDigits: 2, 
                 maximumFractionDigits: 2 
               })} EGP
             </p>
             <p className="text-sm text-muted-foreground">
               Allocation: {(data.percentage || 0).toFixed(1)}%
             </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const BubbleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <div className="space-y-1">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm text-muted-foreground">
              Value: {(data.value || 0).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} EGP
            </p>
            <p className="text-sm text-muted-foreground">
              Allocation: {(data.percentage || 0).toFixed(1)}%
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
    if (!payload || typeof payload.z === 'undefined' || payload.z < 100) {
      return <g></g>;
    }

    // Calculate font size based on bubble size - larger range for bigger bubbles
    const fontSize = Math.max(12, Math.min(20, payload.z / 50));

    return (
      <g>
        <text
          x={cx}
          y={cy}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight="bold"
        >
          {payload.name || 'Unknown'}
        </text>
      </g>
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
        {isSectorChart ? (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="X" 
                  hide 
                  domain={[0, 100]}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Y" 
                  hide 
                  domain={[0, 100]}
                />
                <ZAxis 
                  type="number" 
                  dataKey="z" 
                  range={[200, 4000]} 
                  name="Size"
                />
                <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  data={bubbleData}
                  shape="circle"
                  label={renderCustomizedLabel}
                  onClick={(data) => onStockClick?.(data.name, data.id)}
                  className="cursor-pointer"
                >
                  {bubbleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <Treemap
              data={treeData}
              dataKey="size"
              stroke="#fff"
              fill="#8884d8"
              content={<CustomizedContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
