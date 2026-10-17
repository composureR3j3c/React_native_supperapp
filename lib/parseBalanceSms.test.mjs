// Run with: npm test
// Every sample here is synthetic: invented names, account numbers and amounts. Never paste real bank SMS.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { latestBalances, parseBalanceSms, parseTransactionSms, recentTransactions } from './parseBalanceSms.js';

const sms = (body, date = 1) => ({ address: 'TESTBANK', body, date });

test('balances: common wordings', () => {
  const cases = [
    ['Dear Customer, your A/C ****0001 has been debited ETB 250.00. Avail. Bal: ETB 1,234.56', 1234.56, 'ETB', '0001'],
    ['Acct No. 1000xxxx0002 credited with 5,000.00 Birr. Balance is 12,000.50 Birr', 12000.5, 'ETB', '0002'],
    ['Your balance is Br. 75.25 on account 99990003', 75.25, 'ETB', '0003'],
    ['USD account ****0004 bal $1,000,000.00', 1000000, 'USD', '0004'],
    ['Balance as of 29/09/2026 on A/C ****0005 is ETB 300.00', 300, 'ETB', '0005'],
    ['Bal:500', 500, 'ETB', null],
  ];
  for (const [body, balance, currency, accountLast4] of cases) {
    assert.partialDeepStrictEqual(parseBalanceSms(sms(body)), { balance, currency, accountLast4 }, body);
  }
  assert.equal(parseBalanceSms(sms('Your OTP is 123456. Do not share it.')), null);
});

test('transactions: direction, amount and currency', () => {
  const cases = [
    ['Dear Customer, your A/C ****0001 has been debited ETB 250.00. Avail. Bal: ETB 1,234.56', 'out', 250, 'ETB', '0001'],
    ['Acct No. 1000xxxx0002 credited with 5,000.00 Birr. Balance is 12,000.50 Birr', 'in', 5000, 'ETB', '0002'],
    ['ETB 1,500.00 has been withdrawn from A/C ****0003 on 01/10/2026. Bal ETB 900.00', 'out', 1500, 'ETB', '0003'],
    ['You have received ETB 300.00 into account ****0004. Ref FT26274ABC123', 'in', 300, 'ETB', '0004'],
    ['ETB 100.00 was transferred from your A/C ****0005 and credited to A/C ****9999. Service charge ETB 2.00', 'out', 100, 'ETB', '0005'],
    ['USD account ****0006 deposit of $1,200.50 received', 'in', 1200.5, 'USD', '0006'],
    ['Payment of Br. 75.25 made from account 99990007', 'out', 75.25, 'ETB', '0007'],
    ['Refund ETB 40.00 to A/C ****0008', 'in', 40, 'ETB', '0008'],
    ['Service fee ETB 5.00 applied. ETB 2,000.00 debited from A/C ****0011', 'out', 2000, 'ETB', '0011'],
    ['A/C ****0012 credited ETB 750.00 Ref 20261001123', 'in', 750, 'ETB', '0012'],
  ];
  for (const [body, direction, amount, currency, accountLast4] of cases) {
    assert.partialDeepStrictEqual(parseTransactionSms(sms(body)), { direction, amount, currency, accountLast4 }, body);
  }
});

test('transactions: ignores messages without a money movement', () => {
  for (const body of [
    'Your OTP is 123456. Do not share it.',
    'Balance as of 29/09/2026 on A/C ****0009 is ETB 300.00',
    'Your payment is due on 15/10/2026. Ref 778899',
    'Debited 500 from account ****0010', // no currency, so not trusted as money
  ]) {
    assert.equal(parseTransactionSms(sms(body)), null, body);
  }
});

test('own account: "your account" wins over the other party listed first', () => {
  // Layout where the sender's account comes before yours, with no space between currency and balance.
  const body =
    'Dear Test User You have received ETB 100.00 from account 1********1111 (Other Person) ' +
    'to your account 1********0101. Your current balance is ETB500.85. Thanks for Banking with TESTBANK.';
  assert.partialDeepStrictEqual(parseTransactionSms(sms(body)), { direction: 'in', amount: 100, accountLast4: '0101' });
  assert.partialDeepStrictEqual(parseBalanceSms(sms(body)), { balance: 500.85, currency: 'ETB', accountLast4: '0101' });

  // Debit wording: your account is the source.
  assert.equal(
    parseTransactionSms(sms('ETB 50.00 sent to account 1****2222 from your savings account 1****0303')).accountLast4,
    '0303'
  );
});

test('latestBalances keeps the newest per account; recentTransactions respects the limit', () => {
  const balances = latestBalances([sms('A/C ****0001 Bal: ETB 200.00', 2), sms('A/C ****0001 Bal: ETB 100.00', 1)]);
  assert.equal(balances.length, 1);
  assert.equal(balances[0].balance, 200);

  const messages = Array.from({ length: 60 }, (_, i) => sms(`A/C ****0001 debited ETB ${i + 1}.00`, 1000 - i));
  const recent = recentTransactions(messages, 50);
  assert.equal(recent.length, 50);
  assert.equal(recent[0].amount, 1);
  assert.equal(new Set(recent.map((t) => t.id)).size, 50);
});
