import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  progress?: number;
  target?: number;
  children?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  description,
  progress,
  target,
  children,
}: MetricCardProps) {
  const progressPercent = progress && target ? (progress / target) * 100 : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">{value}</div>
        {progressPercent !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {target && (
              <p className="text-xs text-muted-foreground">
                Target: {target}
              </p>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

