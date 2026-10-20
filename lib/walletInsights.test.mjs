// Run with: npm test
// Every sample here is synthetic: invented amounts and wording. Never paste real bank SMS.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { categorizeTransaction } from './categorizeTransaction.js';
import { parseTransactionSms } from './parseBalanceSms.js';
import { buildPeriods, mainCurrency, percentChange, periodStart } from './walletPeriods.js';

test('categories: inferred from wording', () => {
  const cases = [
    ['Your salary of ETB 20,000.00 has been credited', 'salary'],
    ['ETB 500.00 withdrawn at ATM 0001. Service fee ETB 5.00', 'cash'],
    ['Paid ETB 1,200.00 at Sample Fuel Station via POS', 'fuel'],
    ['Airtime top-up of ETB 100.00 was debited', 'airtime'],
    ['Electricity bill payment of ETB 340.00 debited', 'bills'],
    ['You have transferred ETB 1,000.00 to telebirr', 'mobileMoney'],
    ['POS purchase of ETB 85.00 at Sample Store', 'purchase'],
    ['You have transferred ETB 2,000.00 to account 1***0101', 'transfer'],
    ['Your account was debited ETB 15.00 for SMS service charges', 'fees'],
    ['Refund of ETB 85.00 has been credited', 'refund'],
    ['ETB 50.00 has been debited from your account', 'other'],
  ];
  for (const [body, category] of cases) {
    assert.equal(categorizeTransaction(body), category, body);
  }
});

test('categories: attached to parsed transactions, balance clause ignored', () => {
  const parsed = parseTransactionSms({
    address: 'TESTBANK',
    body: 'Your A/C ****0001 has been debited ETB 300.00 for airtime recharge. Balance: ETB 9,000.00',
    date: 1,
  });
  assert.equal(parsed.category, 'airtime');
  assert.equal(parsed.amount, 300);
});

test('periods: weeks start on Monday, months on the 1st', () => {
  // Wednesday 14 Oct 2026, local time.
  const wednesday = new Date(2026, 9, 14, 15, 30).getTime();
  assert.equal(periodStart(wednesday, 'week').getTime(), new Date(2026, 9, 12).getTime());
  assert.equal(periodStart(wednesday, 'month').getTime(), new Date(2026, 9, 1).getTime());
  // Sunday belongs to the week that started the Monday before.
  assert.equal(periodStart(new Date(2026, 9, 18).getTime(), 'week').getTime(), new Date(2026, 9, 12).getTime());
});

test('periods: totals per period and category, one currency only', () => {
  const tx = (y, m, d, direction, amount, category, currency = 'ETB') => ({
    date: new Date(y, m, d, 12).getTime(),
    direction,
    amount,
    category,
    currency,
  });
  const transactions = [
    tx(2026, 9, 5, 'out', 100, 'fuel'),
    tx(2026, 9, 6, 'out', 50, 'fuel'),
    tx(2026, 9, 7, 'in', 1000, 'salary'),
    tx(2026, 8, 20, 'out', 80, 'bills'),
    tx(2026, 9, 8, 'out', 999, 'fuel', 'USD'),
    tx(2026, 2, 1, 'out', 5, 'other'), // Before the window.
  ];
  const periods = buildPeriods(transactions, { unit: 'month', count: 3, currency: 'ETB', now: new Date(2026, 9, 17).getTime() });

  assert.deepEqual(periods.map((p) => [p.start.getMonth(), p.in, p.out]), [[7, 0, 0], [8, 0, 80], [9, 1000, 150]]);
  assert.deepEqual(periods[2].categories, { fuel: { in: 0, out: 150 }, salary: { in: 1000, out: 0 } });
});

test('mainCurrency and percentChange', () => {
  assert.equal(mainCurrency([{ currency: 'USD' }, { currency: 'ETB' }, { currency: 'ETB' }]), 'ETB');
  assert.equal(mainCurrency([]), 'ETB');
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(10, 0), null);
});
