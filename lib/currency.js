// Platform-wide currency rules. Safe to import from both server and client code.
//
// Wallet balances, transactions, MRR and revenue are all stored in USD.
// Communities can be priced in other currencies; we convert to USD at the
// fixed platform rate below whenever money is credited or summed.

export const INR_PER_USD = 85

// Units of each currency that equal 1 USD. Add more currencies here if needed.
const PER_USD = {
  USD: 1,
  INR: INR_PER_USD,
}

export function toUSD(amount, currency = 'USD') {
  const n = Number(amount) || 0
  const rate = PER_USD[(currency || 'USD').toUpperCase()]
  // Currencies without a platform rate are treated as USD (unchanged behaviour).
  const usd = rate ? n / rate : n
  return Math.round(usd * 100) / 100
}

export const RATE_NOTE = `$1 = ₹${INR_PER_USD}`
