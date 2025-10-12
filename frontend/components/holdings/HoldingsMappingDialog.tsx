"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Strategy {
  id: number;
  name: string;
}

interface Portfolio {
  id: number;
  name: string;
}

interface Holding {
  id: number;
  stock_symbol: string;
  stock_name: string;
  quantity: number;
  average_price: number;
}

interface HoldingsMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdings: Holding[];
  strategies: Strategy[];
  portfolios: Portfolio[];
  onSubmit: (holdingIds: number[], mappingType: "strategy" | "portfolio", targetId: number) => Promise<void>;
}

export function HoldingsMappingDialog({
  open,
  onOpenChange,
  holdings,
  strategies,
  portfolios,
  onSubmit,
}: HoldingsMappingDialogProps) {
  const [mappingType, setMappingType] = useState<"strategy" | "portfolio">("strategy");
  const [targetId, setTargetId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId || holdings.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        holdings.map((h) => h.id),
        mappingType,
        parseInt(targetId)
      );

      setTargetId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to map holdings:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Map Holdings</DialogTitle>
          <DialogDescription>
            Assign {holdings.length} selected holding{holdings.length > 1 ? "s" : ""} to a strategy or portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Selected Holdings Summary */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">Selected Holdings:</p>
              <ul className="text-sm space-y-1">
                {holdings.slice(0, 3).map((holding) => (
                  <li key={holding.id} className="text-muted-foreground">
                    {holding.stock_symbol} - {holding.quantity} shares @ {holding.average_price.toFixed(2)} EGP
                  </li>
                ))}
                {holdings.length > 3 && (
                  <li className="text-muted-foreground">
                    + {holdings.length - 3} more holding{holdings.length - 3 > 1 ? "s" : ""}
                  </li>
                )}
              </ul>
            </div>

            {/* Mapping Type */}
            <div className="space-y-2">
              <Label>Map To</Label>
              <RadioGroup value={mappingType} onValueChange={(value) => {
                setMappingType(value as "strategy" | "portfolio");
                setTargetId("");
              }}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="strategy" id="strategy" />
                  <Label htmlFor="strategy" className="cursor-pointer font-normal">
                    Strategy
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portfolio" id="portfolio" />
                  <Label htmlFor="portfolio" className="cursor-pointer font-normal">
                    Portfolio
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Target Selector */}
            <div className="space-y-2">
              <Label htmlFor="target">
                Select {mappingType === "strategy" ? "Strategy" : "Portfolio"} *
              </Label>
              <Select value={targetId} onValueChange={setTargetId} required>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${mappingType}`} />
                </SelectTrigger>
                <SelectContent>
                  {mappingType === "strategy" ? (
                    strategies.length > 0 ? (
                      strategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id.toString()}>
                          {strategy.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No strategies available
                      </div>
                    )
                  ) : (
                    portfolios.length > 0 ? (
                      portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                          {portfolio.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No portfolios available
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> The holdings will be linked to the selected {mappingType}. 
                {mappingType === "strategy" && " This will include them in the strategy's performance calculations."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !targetId || holdings.length === 0}
            >
              {submitting ? "Mapping..." : "Map Holdings"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

