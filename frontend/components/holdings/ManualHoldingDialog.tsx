"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
}

interface ManualHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stocks: Stock[];
  onSubmit: (data: {
    stock_id: number;
    quantity: number;
    average_price: number;
    purchase_date?: Date;
    notes?: string;
  }) => Promise<void>;
}

export function ManualHoldingDialog({
  open,
  onOpenChange,
  stocks,
  onSubmit,
}: ManualHoldingDialogProps) {
  const [stockId, setStockId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(stockSearch.toLowerCase()) ||
      stock.name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const selectedStock = stocks.find((s) => s.id.toString() === stockId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockId || !quantity || !purchasePrice) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        stock_id: parseInt(stockId),
        quantity: parseInt(quantity),
        average_price: parseFloat(purchasePrice),
        purchase_date: purchaseDate,
        notes: notes || undefined,
      });

      // Reset form
      setStockId("");
      setQuantity("");
      setPurchasePrice("");
      setPurchaseDate(undefined);
      setNotes("");
      setStockSearch("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create holding:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Manual Holding</DialogTitle>
          <DialogDescription>
            Add a stock holding that you purchased outside of a strategy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Stock Selector */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Select value={stockId} onValueChange={setStockId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stock" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stocks..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="pl-8"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {filteredStocks.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id.toString()}>
                      {stock.symbol} - {stock.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStock && (
                <p className="text-sm text-muted-foreground">
                  Current price: {selectedStock.current_price.toFixed(2)} EGP
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of shares"
                required
              />
            </div>

            {/* Purchase Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Purchase Price (EGP) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Price per share"
                required
              />
              {quantity && purchasePrice && (
                <p className="text-sm text-muted-foreground">
                  Total cost: {(parseFloat(quantity) * parseFloat(purchasePrice)).toFixed(2)} EGP
                </p>
              )}
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label>Purchase Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={setPurchaseDate}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this holding..."
                rows={3}
              />
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
            <Button type="submit" disabled={submitting || !stockId || !quantity || !purchasePrice}>
              {submitting ? "Adding..." : "Add Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

