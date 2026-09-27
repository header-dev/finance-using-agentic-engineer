"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { getQuotePrice } from "@/lib/stock-api";

export type ActionResult = { ok: true } | { ok: false; error: string };

const transactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().trim().min(1, "Category is required"),
  date: z.coerce.date({ error: "Please enter a valid date" }),
  description: z.string().trim().max(200).optional(),
});

export type TransactionInput = z.input<typeof transactionSchema>;

const stockSchema = z.object({
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9.\-^=]{1,15}$/, "Invalid ticker symbol"),
  shares: z.coerce.number().positive("Shares must be greater than 0"),
});

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function addTransaction(data: TransactionInput): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await prisma.transaction.create({
    data: { ...parsed.data, description: parsed.data.description || null },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  await prisma.transaction.deleteMany({ where: { id } });

  revalidatePath("/");
  revalidatePath("/transactions");
  return { ok: true };
}

export async function addOrUpdateStock(
  ticker: string,
  shares: number,
): Promise<ActionResult> {
  const parsed = stockSchema.safeParse({ ticker, shares });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  if ((await getQuotePrice(parsed.data.ticker)) == null) {
    return { ok: false, error: `Couldn't find a price for "${parsed.data.ticker}"` };
  }

  await prisma.stockPosition.upsert({
    where: { ticker: parsed.data.ticker },
    create: parsed.data,
    update: { shares: { increment: parsed.data.shares } },
  });

  revalidatePath("/");
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function deleteStock(id: string): Promise<ActionResult> {
  await prisma.stockPosition.deleteMany({ where: { id } });

  revalidatePath("/");
  revalidatePath("/portfolio");
  return { ok: true };
}
