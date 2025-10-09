import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "./StockLogo";
import { TrendingUp, TrendingDown } from "lucide-react";
import { TrendSparkline } from "./charts/TrendSparkline";

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change?: number;
  changePercent?: number;
  logoUrl?: string | null;
  trendData?: number[];
  onClick?: () => void;
}

export function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  logoUrl,
  trendData,
  onClick,
}: StockCardProps) {
  const isPositive = (changePercent || 0) >= 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <StockLogo symbol={symbol} name={name} logoUrl={logoUrl} size={40} />
          <div>
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <p className="text-xs text-muted-foreground">{name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{price.toFixed(2)} EGP</div>
            {changePercent !== undefined && (
              <Badge
                variant="secondary"
                className={`mt-2 ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%
              </Badge>
            )}
          </div>
          {trendData && trendData.length > 0 && (
            <div>
              <TrendSparkline
                data={trendData}
                color={isPositive ? "#16a34a" : "#dc2626"}
                width={80}
                height={40}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

