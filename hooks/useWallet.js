import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { latestBalances, recentTransactions } from '../lib/parseBalanceSms';
import { isSmsReaderAvailable, readInbox } from '../modules/sms-reader';

// About six full months, so the monthly trend has data for every bar it shows.
export const LOOKBACK_DAYS = 190;
const MAX_MESSAGES = 3000;

const WalletContext = createContext(null);

// Reads bank SMS once for all Wallet pages. Balances and transactions live in memory only;
// they are re-read from SMS each time and never saved to storage.
export function WalletProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | denied | blocked | unsupported | error
  const [hidden, setHidden] = useState(false);
  // Set from Balances when an account is tapped; In & Out then shows only that account.
  const [accountFilter, setAccountFilter] = useState(null);

  const load = useCallback(async () => {
    if (Platform.OS !== 'android' || !isSmsReaderAvailable) {
      setStatus('unsupported');
      return;
    }
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    try {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
        title: 'Read bank messages',
        message: 'Driver Assistant reads bank SMS on this phone to show your balances and transactions. Nothing leaves your device.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        setStatus('blocked');
        return;
      }
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        setStatus('denied');
        return;
      }

      const messages = await readInbox({
        sinceMs: Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
        limit: MAX_MESSAGES,
      });
      setAccounts(latestBalances(messages));
      setTransactions(recentTransactions(messages, Infinity));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({ accounts, transactions, status, load, hidden, setHidden, accountFilter, setAccountFilter }),
    [accounts, transactions, status, load, hidden, accountFilter]
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export default function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('useWallet must be used inside WalletProvider');
  return wallet;
}
