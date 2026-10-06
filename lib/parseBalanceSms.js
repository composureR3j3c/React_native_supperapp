// Extracts account balances from bank SMS messages, entirely on-device.
// Only the sender, the last 4 digits of the account, the balance and the date are kept —
// message bodies and full account numbers are discarded after parsing.
//
// Bank SMS formats vary. This matches common wording ("Bal", "Balance", "Avail. Bal") followed by an
// amount with an optional currency. Extend CURRENCY or the patterns below if your bank's format is missed.

const CURRENCY = '(ETB|Birr|Br\\.?|USD|EUR|GBP|\\$)';
// Not part of a masked account ("****0005") or a date ("29/09/2026").
const AMOUNT = '(?<![*xX\\d])(\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:\\.\\d{1,2})?)(?![\\d/]|[.-]\\d)';
// Text allowed between "balance" and the amount: words, dates and masked account numbers.
const GAP = '(?:[^\\d\\n]|\\d{1,4}[/.-]\\d{1,2}[/.-]\\d{1,4}|[*xX]+\\d+)';

// "Balance: ETB 1,234.56", "Avail Bal is 1234.56 Birr", "Balance as of 29/09/2026 is ETB 300.00"
const BALANCE_PATTERN = new RegExp(
  `\\b(?:avail(?:able)?\\.?\\s+)?bal(?:ance)?\\b${GAP}{0,40}?${CURRENCY}?\\s*${AMOUNT}\\s*${CURRENCY}?`,
  'i'
);

// "A/C ****1234", "Acct No. 1000xxxx5678", "account 12345678"
const ACCOUNT_PATTERN = /\b(?:a\/c|acct|acc(?:ount)?)\.?\s*(?:no\.?|number|#)?\s*:?\s*([*xX\d][*xX\d-]{3,})/i;

function normalizeCurrency(raw) {
  if (!raw) return 'ETB';
  const value = raw.replace('.', '').toUpperCase();
  if (value === 'BIRR' || value === 'BR') return 'ETB';
  if (value === '$') return 'USD';
  return value;
}

export function parseBalanceSms({ address, body, date }) {
  if (!body) return null;
  const balanceMatch = body.match(BALANCE_PATTERN);
  if (!balanceMatch) return null;

  const [, currencyBefore, amount, currencyAfter] = balanceMatch;
  const balance = Number(amount.replace(/,/g, ''));
  if (!Number.isFinite(balance)) return null;

  const accountDigits = body.match(ACCOUNT_PATTERN)?.[1].replace(/\D/g, '') ?? '';

  return {
    sender: address?.trim() || 'Unknown',
    accountLast4: accountDigits.length >= 4 ? accountDigits.slice(-4) : null,
    balance,
    currency: normalizeCurrency(currencyBefore ?? currencyAfter),
    date,
  };
}

// Transaction amounts must carry a currency ("ETB 250.00", "5,000 Birr") so dates, codes and reference numbers
// are never mistaken for money.
const MONEY_PATTERN = new RegExp(`${CURRENCY}\\s*${AMOUNT}|${AMOUNT}\\s*${CURRENCY}`, 'gi');
const DEBIT_WORDS = /\b(debited|withdrawn|withdrawal|paid|payment|sent|transferred|purchased?|spent|charged)\b/i;
const CREDIT_WORDS = /\b(credited|deposited|deposit|received|refund(?:ed)?)\b/i;

function firstMatch(pattern, text) {
  const match = text.match(pattern);
  return match ? { start: match.index, end: match.index + match[0].length } : null;
}

// Characters between the keyword and an amount, on either side.
function distance(keyword, money) {
  const moneyEnd = money.index + money[0].length;
  return money.index >= keyword.end ? money.index - keyword.end : keyword.start - moneyEnd;
}

// Extracts one money movement (in or out) from a bank SMS. Only direction, amount, currency, sender,
// account last 4 and date are kept — names, merchants and reference numbers are deliberately not extracted.
export function parseTransactionSms({ address, body, date }) {
  if (!body) return null;

  // Blank out the balance clause so the balance is never read as the transaction amount.
  const balanceMatch = body.match(BALANCE_PATTERN);
  const text = balanceMatch
    ? body.slice(0, balanceMatch.index) + ' '.repeat(balanceMatch[0].length) + body.slice(balanceMatch.index + balanceMatch[0].length)
    : body;

  const debit = firstMatch(DEBIT_WORDS, text);
  const credit = firstMatch(CREDIT_WORDS, text);
  if (!debit && !credit) return null;
  // When both appear ("transferred from your account and credited to ..."), the first word describes your side.
  const direction = !credit || (debit && debit.start < credit.start) ? 'out' : 'in';
  const keyword = direction === 'out' ? debit : credit;

  // The amount nearest the keyword ("debited ETB 250", "ETB 250 was debited"), not a fee further away.
  const amounts = [...text.matchAll(MONEY_PATTERN)];
  if (amounts.length === 0) return null;
  const chosen = amounts.reduce((best, m) => (distance(keyword, m) < distance(keyword, best) ? m : best));

  const [, currencyBefore, amountBefore, amountAfter, currencyAfter] = chosen;
  const amount = Number((amountBefore ?? amountAfter).replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const accountDigits = body.match(ACCOUNT_PATTERN)?.[1].replace(/\D/g, '') ?? '';

  return {
    sender: address?.trim() || 'Unknown',
    accountLast4: accountDigits.length >= 4 ? accountDigits.slice(-4) : null,
    direction,
    amount,
    currency: normalizeCurrency(currencyBefore ?? currencyAfter),
    date,
  };
}

// Newest transactions first, up to `limit`. `messages` must be sorted newest first.
export function recentTransactions(messages, limit = 50) {
  const transactions = [];
  for (const message of messages) {
    const parsed = parseTransactionSms(message);
    if (!parsed) continue;
    transactions.push({ id: `${parsed.date}|${parsed.sender}|${transactions.length}`, ...parsed });
    if (transactions.length >= limit) break;
  }
  return transactions;
}

// Keeps the newest balance per sender + account. `messages` must be sorted newest first.
export function latestBalances(messages) {
  const byAccount = new Map();
  for (const message of messages) {
    const parsed = parseBalanceSms(message);
    if (!parsed) continue;
    const key = `${parsed.sender}|${parsed.accountLast4 ?? ''}`;
    if (!byAccount.has(key)) byAccount.set(key, { id: key, ...parsed });
  }
  return [...byAccount.values()];
}
