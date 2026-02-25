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

/** Format a number in the specified currency (e.g. "1 250 $") */
export function formatMultiCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a number in the specified currency with decimals */
export function formatMultiCurrencyDecimals(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}
