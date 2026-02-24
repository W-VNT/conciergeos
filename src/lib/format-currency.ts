const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const formatterDecimals = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** Format a number as EUR currency without decimals (e.g. "1 250 €") */
export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}

/** Format a number as EUR currency with decimals (e.g. "1 250,00 €") */
export function formatCurrencyDecimals(amount: number): string {
  return formatterDecimals.format(amount);
}
