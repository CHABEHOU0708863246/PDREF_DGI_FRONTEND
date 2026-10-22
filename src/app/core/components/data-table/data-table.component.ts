import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';
import type { DataTableColumn, SortDirection, TableState } from '../../models/table/table.model';
import { IconComponent } from '../icon/icon.component';
import { StatePanelComponent } from '../state-panel/state-panel.component';

const PAGE_SIZES = [10, 25, 50] as const;

@Component({
  selector: 'pdref-data-table',
  standalone: true,
  imports: [IconComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  readonly columns = input.required<readonly DataTableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly state = input.required<TableState>();
  readonly totalCount = input(0);
  readonly loading = input(false);
  readonly problem = input<ApiProblemDetails | null>(null);
  readonly caption = input('Tableau de donnees');
  readonly emptyTitle = input('Aucune donnee');
  readonly emptyMessage = input('Aucun element a afficher.');
  readonly rowKey = input.required<(row: T) => string>();
  readonly pageSizes = PAGE_SIZES;

  readonly stateChange = output<TableState>();
  readonly retry = output<void>();

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.state().pageSize)),
  );
  readonly firstIndex = computed(() =>
    this.totalCount() === 0 ? 0 : this.state().pageSize * (this.state().page - 1) + 1,
  );
  readonly lastIndex = computed(() =>
    Math.min(this.totalCount(), this.state().page * this.state().pageSize),
  );

  cellValue(row: T, column: DataTableColumn<T>): string {
    if (column.format) {
      return column.format(row);
    }
    const value = row[column.key];
    return value === null || value === undefined ? '' : String(value);
  }

  ariaSort(column: DataTableColumn<T>): 'ascending' | 'descending' | 'none' {
    const state = this.state();
    if (state.sort !== column.key) {
      return 'none';
    }
    return state.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(column: DataTableColumn<T>): 'arrow-up' | 'arrow-down' | 'sort' {
    const sort = this.ariaSort(column);
    return sort === 'ascending' ? 'arrow-up' : sort === 'descending' ? 'arrow-down' : 'sort';
  }

  toggleSort(column: DataTableColumn<T>): void {
    if (!column.sortable) {
      return;
    }

    const state = this.state();
    const direction: SortDirection =
      state.sort === column.key && state.direction === 'asc' ? 'desc' : 'asc';

    this.stateChange.emit({
      ...state,
      page: 1,
      sort: column.key,
      direction,
    });
  }

  changePage(page: number): void {
    const next = Math.min(this.pageCount(), Math.max(1, page));
    if (next === this.state().page) {
      return;
    }
    this.stateChange.emit({ ...this.state(), page: next });
  }

  changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    this.stateChange.emit({ ...this.state(), page: 1, pageSize: value });
  }
}
