import { useCallback, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { latestBalances, recentTransactions } from '../lib/parseBalanceSms';
import { isSmsReaderAvailable, readInbox } from '../modules/sms-reader';

const LOOKBACK_DAYS = 90;
const MAX_MESSAGES = 1000;

const belongsTo = (account) => (item) =>
  item.sender === account.sender && item.accountLast4 === account.accountLast4;

// The accounts with the most transactions in the lookback window; ties go to the newest balance.
// Like the Wallet screen, balances stay in memory only and are re-read from SMS on each load.
export default function useTopAccounts(limit) {
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | ready | needsPermission | unsupported | error

  const load = useCallback(async () => {
    if (Platform.OS !== 'android' || !isSmsReaderAvailable) {
      setStatus('unsupported');
      return;
    }
    try {
      // Only check here; the dashboard never pops the permission prompt on its own.
      if (!(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS))) {
        setStatus('needsPermission');
        return;
      }
      const messages = await readInbox({
        sinceMs: Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
        limit: MAX_MESSAGES,
      });
      const transactions = recentTransactions(messages, Infinity);
      const ranked = latestBalances(messages)
        .map((account) => ({ account, count: transactions.filter(belongsTo(account)).length }))
        .sort((a, b) => b.count - a.count || new Date(b.account.date) - new Date(a.account.date))
        .map(({ account }) => account);
      setAccounts(ranked.slice(0, limit));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [limit]);

  return { accounts, status, load };
}
