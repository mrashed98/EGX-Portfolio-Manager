"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioPerformance {
  portfolio_id: number;
  portfolio_name: string;
  time_series: { date: string; value: number }[];
}

interface CorrelationMatrixProps {
  data: PortfolioPerformance[];
  calculateCorrelation: (series1: number[], series2: number[]) => number;
  title?: string;
  description?: string;
}

export function CorrelationMatrix({
  data,
  calculateCorrelation,
  title = "Correlation Matrix",
  description = "Correlation between portfolio performances",
}: CorrelationMatrixProps) {
  // Calculate correlation matrix
  const matrix: number[][] = [];
  
  for (let i = 0; i < data.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < data.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0; // Perfect correlation with itself
      } else {
        const series1 = data[i].time_series.map((p) => p.value);
        const series2 = data[j].time_series.map((p) => p.value);
        matrix[i][j] = calculateCorrelation(series1, series2);
      }
    }
  }

  // Get color for correlation value
  const getColor = (value: number): string => {
    if (value >= 0.8) return "bg-green-500";
    if (value >= 0.5) return "bg-green-400";
    if (value >= 0.2) return "bg-yellow-400";
    if (value >= -0.2) return "bg-gray-300";
    if (value >= -0.5) return "bg-orange-400";
    if (value >= -0.8) return "bg-red-400";
    return "bg-red-500";
  };

  const getTextColor = (value: number): string => {
    if (Math.abs(value) >= 0.5) return "text-white";
    return "text-gray-900";
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted/50 text-left text-xs font-medium">
                    Portfolio
                  </th>
                  {data.map((portfolio, index) => (
                    <th
                      key={portfolio.portfolio_id}
                      className="border p-2 bg-muted/50 text-center text-xs font-medium"
                      title={portfolio.portfolio_name}
                    >
                      P{index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((portfolio, i) => (
                  <tr key={portfolio.portfolio_id}>
                    <td className="border p-2 bg-muted/50 text-xs font-medium truncate max-w-[120px]">
                      <span title={portfolio.portfolio_name}>
                        P{i + 1}: {portfolio.portfolio_name}
                      </span>
                    </td>
                    {data.map((_, j) => {
                      const value = matrix[i][j];
                      return (
                        <td
                          key={j}
                          className={`border p-2 text-center text-xs font-semibold ${getColor(
                            value
                          )} ${getTextColor(value)}`}
                          title={`Correlation: ${value.toFixed(3)}`}
                        >
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Strong Positive (0.8+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Moderate (0.2-0.5)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Weak (-0.2 to 0.2)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Strong Negative (-0.8 or less)</span>
            </div>
          </div>

          {/* Interpretation */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Interpretation:</strong> Values close to +1 indicate portfolios move together.
              Values close to -1 indicate portfolios move in opposite directions.
              Values near 0 indicate little to no relationship.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

