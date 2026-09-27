export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORIES: Record<TransactionType, readonly string[]> = {
  INCOME: ["Salary", "Freelance", "Dividends", "Other"],
  EXPENSE: [
    "Housing",
    "Food",
    "Transport",
    "Utilities",
    "Entertainment",
    "Health",
    "Shopping",
    "Other",
  ],
};
