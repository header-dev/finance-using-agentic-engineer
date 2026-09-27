"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addOrUpdateStock } from "@/lib/actions";

export function AddStockForm() {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const symbol = ticker.trim().toUpperCase();
      const result = await addOrUpdateStock(symbol, Number(shares));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Added ${shares} ${symbol}`);
      setTicker("");
      setShares("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="ticker">Ticker</Label>
        <Input
          id="ticker"
          placeholder="e.g. AAPL"
          autoComplete="off"
          required
          maxLength={15}
          className="uppercase placeholder:normal-case"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="shares">Shares</Label>
        <Input
          id="shares"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder="0"
          required
          value={shares}
          onChange={(e) => setShares(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Adding a ticker you already hold adds to your existing shares.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Looking up price…" : "Add stock"}
      </Button>
    </form>
  );
}
