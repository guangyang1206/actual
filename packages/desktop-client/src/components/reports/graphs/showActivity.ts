import type { NavigateFunction } from 'react-router';

import * as monthUtils from '@actual-app/core/shared/months';
import type {
  AccountEntity,
  balanceTypeOpType,
  CategoryEntity,
  CategoryGroupEntity,
  RuleConditionEntity,
} from '@actual-app/core/types/models';
import type { UncategorizedEntity } from '#components/reports/ReportOptions';

import { ReportOptions, categoryLists } from '#components/reports/ReportOptions';

type showActivityProps = {
  navigate: NavigateFunction;
  categories: { list: CategoryEntity[]; grouped: CategoryGroupEntity[] };
  accounts: AccountEntity[];
  balanceTypeOp: balanceTypeOpType;
  filters: RuleConditionEntity[];
  showHiddenCategories: boolean;
  showOffBudget: boolean;
  type: string;
  startDate: string;
  endDate?: string;
  field?: string;
  id?: string | string[]; // changed: supports array for oneOf
  name?: string; // display name, used to detect transfer/uncategorized special categories
  interval?: string;
};

export function showActivity({
  navigate,
  categories,
  accounts,
  balanceTypeOp,
  filters,
  showHiddenCategories,
  showOffBudget,
  type,
  startDate,
  endDate,
  field,
  id,
  name,
  interval = 'Day',
}: showActivityProps) {
  const isOutFlow =
    balanceTypeOp === 'totalDebts' || type === 'debts' ? true : false;
  const hiddenCategories = categories.list.filter(f => f.hidden).map(e => e.id);
  const offBudgetAccounts = accounts.filter(f => f.offbudget).map(e => e.id);
  const fromDate =
    interval === 'Weekly'
      ? 'dayFromDate'
      : (((ReportOptions.intervalMap.get(interval) || 'Day').toLowerCase() +
          'FromDate') as 'dayFromDate' | 'monthFromDate' | 'yearFromDate');
  const isDateOp = interval === 'Weekly' || type !== 'time';

  // Detect if the clicked category is the synthetic "Transfers" entry.
  // When groupBy='Category', the "Transfers" bar has id='' (empty string)
  // because transferCategory.id is ''. We need to use a transfer filter instead.
  let transferFilter: RuleConditionEntity | null = null;
  if (
    field === 'category' &&
    (!id || id === '') &&
    name
  ) {
    const [categoryList] = categoryLists(categories);
    const transferEntry = categoryList.find(
      (item: UncategorizedEntity) =>
        item.uncategorized_id === 'transfer' &&
        item.name === name,
    );
    if (transferEntry) {
      transferFilter = {
        field: 'transfer',
        op: 'is',
        value: true,
        type: 'boolean',
      } as unknown as RuleConditionEntity;
    }
  }

  const filterConditions = [
    ...filters,
    transferFilter || (id && {
      // changed: use oneOf when id is an array, is when it's a string
      field,
      op: Array.isArray(id) ? 'oneOf' : 'is',
      value: id,
      type: 'id',
    }),
    {
      field: 'date',
      op: isDateOp ? 'gte' : 'is',
      value: isDateOp ? startDate : monthUtils[fromDate](startDate),
      type: 'date',
    },
    isDateOp && {
      field: 'date',
      op: 'lte',
      value: endDate,
      options: { date: true },
    },
    !(
      ['netAssets', 'netDebts'].includes(balanceTypeOp) ||
      (['totalTotals', 'totalBudgeted'].includes(balanceTypeOp) &&
        (type === 'totals' || type === 'time'))
    ) && {
      field: 'amount',
      op: 'gte',
      value: 0,
      options: {
        type: 'number',
        inflow: !isOutFlow,
        outflow: isOutFlow,
      },
    },
    hiddenCategories.length > 0 &&
      !showHiddenCategories && {
        field: 'category',
        op: 'notOneOf',
        value: hiddenCategories,
        type: 'id',
      },
    offBudgetAccounts.length > 0 &&
      !showOffBudget && {
        field: 'account',
        op: 'notOneOf',
        value: offBudgetAccounts,
        type: 'id',
      },
  ].filter(f => f);

  void navigate(balanceTypeOp === 'totalBudgeted' ? '/budget' : '/accounts', {
    state:
      balanceTypeOp === 'totalBudgeted'
        ? { goBack: true }
        : { goBack: true, filterConditions },
  });
}
