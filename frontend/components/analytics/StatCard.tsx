import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  description,
  trend,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === "up" || (change !== undefined && change > 0))
      return "text-green-600";
    if (trend === "down" || (change !== undefined && change < 0))
      return "text-red-600";
    return "text-muted-foreground";
  };

  const getTrendIcon = () => {
    if (trend === "up" || (change !== undefined && change > 0))
      return <TrendingUp className="h-4 w-4" />;
    if (trend === "down" || (change !== undefined && change < 0))
      return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined || description) && (
          <div className="flex items-center gap-2 mt-1">
            {change !== undefined && (
              <Badge
                variant="secondary"
                className={`${getTrendColor()} flex items-center gap-1`}
              >
                {getTrendIcon()}
                <span>
                  {change > 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              </Badge>
            )}
            {changeLabel && (
              <p className="text-xs text-muted-foreground">{changeLabel}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

