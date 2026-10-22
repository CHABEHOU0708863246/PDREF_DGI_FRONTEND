export type SortDirection = 'asc' | 'desc';

export interface TableState {
  page: number;
  pageSize: number;
  sort: string | null;
  direction: SortDirection;
  filters: Record<string, string>;
}

export interface DataTableColumn<T> {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: (row: T) => string;
}

export interface PageChange {
  page: number;
  pageSize: number;
}

export interface SortChange {
  sort: string;
  direction: SortDirection;
}

export const DEFAULT_TABLE_STATE: TableState = {
  page: 1,
  pageSize: 10,
  sort: null,
  direction: 'asc',
  filters: {},
};
