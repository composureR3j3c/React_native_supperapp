// Infers a spending/income category from a bank SMS, on-device. Only the category key is kept —
// the merchant or counterparty text that triggered it is never stored.
//
// Rules are checked in order and the first match wins, so specific ones (ATM, fuel) come before broad ones
// (purchase, transfer) and fees come last: "ATM withdrawal ETB 500, fee ETB 5" is Cash & ATM, not Fees.

export const CATEGORIES = {
  salary: { label: 'Salary', icon: 'briefcase-outline' },
  loan: { label: 'Loan', icon: 'business-outline' },
  refund: { label: 'Refund', icon: 'return-down-back-outline' },
  cash: { label: 'Cash & ATM', icon: 'cash-outline' },
  fuel: { label: 'Fuel', icon: 'speedometer-outline' },
  airtime: { label: 'Airtime & data', icon: 'phone-portrait-outline' },
  bills: { label: 'Bills', icon: 'receipt-outline' },
  mobileMoney: { label: 'Mobile money', icon: 'phone-portrait-outline' },
  purchase: { label: 'Purchases', icon: 'cart-outline' },
  transfer: { label: 'Transfers', icon: 'swap-horizontal-outline' },
  fees: { label: 'Fees', icon: 'pricetag-outline' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
};

const RULES = [
  ['salary', /\b(salary|payroll|wages?)\b/i],
  ['loan', /\b(loan|repayment|instal?ment)\b/i],
  ['refund', /\b(refund(?:ed)?|reversal|reversed)\b/i],
  ['cash', /\b(atm|cash\s+(?:withdrawal|deposit)|withdrawn|withdrawal)\b/i],
  ['fuel', /\b(fuel|petrol|benzine|diesel|gas\s+station|total\s*energies|oil\s*libya)\b/i],
  ['airtime', /\b(airtime|top[\s-]?up|recharge|data\s+(?:bundle|package)|ethio\s*telecom|safaricom)\b/i],
  ['bills', /\b(bills?|utility|utilities|electric(?:ity)?|eeu|water|dstv|internet|rent|tuition|school)\b/i],
  ['mobileMoney', /\b(tele\s*birr|m-?pesa|cbe\s*birr|amole|hello\s*cash|e-?birr|kacha|wallet)\b/i],
  ['purchase', /\b(pos|purchased?|merchant|card|shop|store|supermarket)\b/i],
  ['transfer', /\b(transfer(?:red)?|sent|send)\b/i],
  ['fees', /\b(fees?|charges|service\s+charge|commission|vat|penalty)\b/i],
];

export function categorizeTransaction(text) {
  if (!text) return 'other';
  for (const [key, pattern] of RULES) {
    if (pattern.test(text)) return key;
  }
  return 'other';
}
