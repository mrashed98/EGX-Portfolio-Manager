"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

interface Watchlist {
  id: number;
  name: string;
  stock_ids: number[];
}

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = async () => {
    try {
      const response = await api.get("/watchlists");
      setWatchlists(response.data);
    } catch (error) {
      console.error("Failed to load watchlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) return;

    try {
      await api.delete(`/watchlists/${id}`);
      toast({
        title: "Success",
        description: "Watchlist deleted successfully",
      });
      loadWatchlists();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete watchlist",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading watchlists...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Watchlists</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Watchlist
        </Button>
      </div>

      {watchlists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No watchlists yet. Create a watchlist to track stocks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => (
            <Card key={watchlist.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{watchlist.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(watchlist.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {watchlist.stock_ids.length} stocks
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

