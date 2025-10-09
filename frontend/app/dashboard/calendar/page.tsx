"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { Calendar, TrendingUp, DollarSign, Building2 } from "lucide-react";

interface CalendarEvent {
  logoid?: string;
  name: string;
  earnings_per_share_fq?: number;
  dividends_yield?: number;
  market_cap_basic?: number;
  date?: string;
}

export default function CalendarPage() {
  const [earnings, setEarnings] = useState<CalendarEvent[]>([]);
  const [dividends, setDividends] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      const [earningsResponse, dividendsResponse] = await Promise.all([
        api.get("/stocks/calendar/earnings"),
        api.get("/stocks/calendar/dividends"),
      ]);

      setEarnings(earningsResponse.data.earnings || []);
      setDividends(dividendsResponse.data.dividends || []);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Market Calendar</h1>
            <p className="text-muted-foreground">Upcoming earnings and dividend events</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Market Calendar</h1>
          <p className="text-muted-foreground">Upcoming earnings and dividend events</p>
        </div>
      </div>

      <Tabs defaultValue="earnings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Earnings ({earnings.length})
          </TabsTrigger>
          <TabsTrigger value="dividends" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Dividends ({dividends.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Earnings</CardTitle>
              <CardDescription>Companies reporting earnings soon</CardDescription>
            </CardHeader>
            <CardContent>
              {earnings.length > 0 ? (
                <div className="space-y-4">
                  {earnings.slice(0, 20).map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.earnings_per_share_fq 
                              ? `EPS: ${event.earnings_per_share_fq.toFixed(2)}`
                              : 'Earnings Report'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.market_cap_basic && (
                          <Badge variant="outline" className="mb-2">
                            Market Cap: {(event.market_cap_basic / 1000000).toFixed(0)}M
                          </Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {event.date || 'Upcoming'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No earnings events available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dividends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Dividends</CardTitle>
              <CardDescription>Companies paying dividends soon</CardDescription>
            </CardHeader>
            <CardContent>
              {dividends.length > 0 ? (
                <div className="space-y-4">
                  {dividends.slice(0, 20).map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.dividends_yield 
                              ? `Yield: ${event.dividends_yield.toFixed(2)}%`
                              : 'Dividend Payment'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.market_cap_basic && (
                          <Badge variant="outline" className="mb-2">
                            Market Cap: {(event.market_cap_basic / 1000000).toFixed(0)}M
                          </Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {event.date || 'Upcoming'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No dividend events available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
