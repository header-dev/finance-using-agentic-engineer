"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addTransaction } from "@/lib/actions";
import { CATEGORIES, type TransactionType } from "@/lib/constants";

const today = () => format(new Date(), "yyyy-MM-dd");

export function TransactionForm() {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast.error("Please choose a category");
      return;
    }
    startTransition(async () => {
      const result = await addTransaction({
        type,
        category,
        amount,
        // Local noon keeps the calendar day stable across time zones.
        date: `${date}T12:00:00`,
        description,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${type === "INCOME" ? "Income" : "Expense"} added`);
      setAmount("");
      setDescription("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Tabs
        value={type}
        onValueChange={(value) => {
          setType(value as TransactionType);
          setCategory(null);
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="EXPENSE">Expense</TabsTrigger>
          <TabsTrigger value="INCOME">Income</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={(value) => setCategory(value)}>
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES[type].map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          maxLength={200}
          placeholder="e.g. Groceries"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add transaction"}
      </Button>
    </form>
  );
}
