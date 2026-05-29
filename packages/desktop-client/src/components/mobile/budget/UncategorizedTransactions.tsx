import React, { useCallback, useEffect, useState } from 'react';

import { isPreviewId } from '@actual-app/core/shared/transactions';
import type { TransactionEntity } from '@actual-app/core/types/models';
import { TransactionListWithBalances } from '#components/mobile/budget/TransactionListWithBalances';
import { SchedulesProvider } from '#hooks/useCachedSchedules';
import { useDateFormat } from '#hooks/useDateFormat';
import { useNavigate } from '#hooks/useNavigate';
import { useTransactions } from '#hooks/useTransactions';
import { useTransactionsSearch } from '#hooks/useTransactionsSearch';
import { uncategorizedTransactions } from '#queries';
import * as bindings from '#spreadsheet/bindings';

const { listen } = bindings;
export function UncategorizedTransactions() {
  const navigate = useNavigate();
  const [
    transactionsQuery,
    setTransactionsQuery,
  ] = useState(
    baseTransactionsQuery()
  );

  // Fix #7974: refetch uncategorized list when bank sync completes
  useEffect(() => {
    const unsubscribe = listen('sync-event', (event: { tables: string[] }) => {
      if (event?.tables?.includes('transactions')) {
        setTransactionsQuery(baseTransactionsQuery());
      }
    });
    return unsubscribe;
  }, [baseTransactionsQuery]);

  const {
