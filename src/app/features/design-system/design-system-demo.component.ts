import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AmountFcfaComponent } from '../../core/components/amount-fcfa/amount-fcfa.component';
import { BreadcrumbComponent } from '../../core/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogComponent } from '../../core/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogWithInputComponent } from '../../core/components/confirm-dialog-with-input/confirm-dialog-with-input.component';
import { ContribuableSelectComponent } from '../../core/components/contribuable-select/contribuable-select.component';
import { DataTableComponent } from '../../core/components/data-table/data-table.component';
import { EmptyIllustrationComponent } from '../../core/components/empty-illustration/empty-illustration.component';
import { ErrorFooterComponent } from '../../core/components/error-footer/error-footer.component';
import { FormGuideComponent } from '../../core/components/form-guide/form-guide.component';
import type { GuideStep } from '../../core/components/form-guide/form-guide.component';
import { IconComponent } from '../../core/components/icon/icon.component';
import { KpiCardComponent } from '../../core/components/kpi-card/kpi-card.component';
import { NotificationCenterComponent } from '../../core/components/notification-center/notification-center.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { PhoneInputComponent } from '../../core/components/phone-input/phone-input.component';
import { SkeletonComponent } from '../../core/components/skeleton/skeleton.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { StatusBadgeComponent } from '../../core/components/status-badge/status-badge.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';
import { UploadFieldComponent } from '../../core/components/upload-field/upload-field.component';
import type { DataTableColumn, TableState } from '../../core/models/table/table.model';
import { resolveStatus } from '../../core/models/common/status.model';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import { NotificationService } from '../../core/services/notifications/notification.service';
import { TableQueryService } from '../../core/services/table/table-query.service';
import { ThemeService } from '../../core/services/theme/theme.service';
import { UploadProgressService } from '../../core/services/upload/upload-progress.service';
import { formatFcfa } from '../../core/utils/format-fcfa';

interface DemoRow {
  id: string;
  reference: string;
  label: string;
  status: string;
  amount: string;
  date: string;
}

type TableVariant = 'success' | 'empty' | 'loading' | 'error';

const DEMO_ROWS: readonly DemoRow[] = [
  {
    id: 'demo-row-1',
    reference: 'DEMO-001',
    label: 'Dossier de demonstration A',
    status: 'DEMO_PENDING',
    amount: '1234567.5',
    date: '2026-10-21T10:00:00Z',
  },
  {
    id: 'demo-row-2',
    reference: 'DEMO-002',
    label: 'Dossier de demonstration B',
    status: 'DEMO_ACTIVE',
    amount: '980000',
    date: '2026-10-20T09:30:00Z',
  },
  {
    id: 'demo-row-3',
    reference: 'DEMO-003',
    label: 'Dossier de demonstration C',
    status: 'DEMO_SUCCESS',
    amount: '0',
    date: '2026-10-19T14:15:00Z',
  },
  {
    id: 'demo-row-4',
    reference: 'DEMO-004',
    label: 'Dossier de demonstration D',
    status: 'DEMO_WARNING',
    amount: '-45000',
    date: '2026-10-18T08:00:00Z',
  },
  {
    id: 'demo-row-5',
    reference: 'DEMO-005',
    label: 'Dossier de demonstration E',
    status: 'DEMO_DANGER',
    amount: '7654321.99',
    date: '2026-10-17T16:45:00Z',
  },
  {
    id: 'demo-row-6',
    reference: 'DEMO-006',
    label: 'Dossier de demonstration F',
    status: 'DEMO_PENDING',
    amount: '120000',
    date: '2026-10-16T11:20:00Z',
  },
];

const DEMO_PROBLEM: ApiProblemDetails = {
  type: 'urn:pdref:error:DEMO_ERROR',
  title: 'Exemple d erreur normalisee',
  status: 422,
  detail: 'Le dossier de demonstration est incomplet.',
  instance: '/design-system-demo',
  code: 'DEMO_ERROR',
  traceId: 'demo-trace-9f2c4d1a',
  reference: 'ERR-2026-DEMO',
  errors: [{ field: 'reference', message: 'La reference est obligatoire.' }],
};

@Component({
  selector: 'pdref-design-system-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AmountFcfaComponent,
    BreadcrumbComponent,
    ConfirmDialogComponent,
    ConfirmDialogWithInputComponent,
    ContribuableSelectComponent,
    DataTableComponent,
    EmptyIllustrationComponent,
    ErrorFooterComponent,
    FormGuideComponent,
    IconComponent,
    KpiCardComponent,
    NotificationCenterComponent,
    PageHeaderComponent,
    PhoneInputComponent,
    SkeletonComponent,
    StatePanelComponent,
    StatusBadgeComponent,
    ThemeToggleComponent,
    UploadFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-demo.component.html',
  styleUrl: './design-system-demo.component.scss',
})
export class DesignSystemDemoComponent implements OnDestroy {
  private readonly meta = inject(Meta);
  private readonly notifications = inject(NotificationService);
  private readonly tableQuery = inject(TableQueryService);
  private readonly uploadProgress = inject(UploadProgressService);
  private uploadTimer: number | null = null;

  readonly theme = inject(ThemeService);
  readonly reducedDemo = signal(false);
  readonly breadcrumbs = [{ label: 'Accueil', url: '/dashboard' }, { label: 'Design system' }];
  readonly problem = DEMO_PROBLEM;
  readonly statusCodes = [
    'DEMO_PENDING',
    'DEMO_ACTIVE',
    'DEMO_SUCCESS',
    'DEMO_WARNING',
    'DEMO_DANGER',
  ];
  readonly kpis = [
    {
      label: 'Indicateur A',
      value: '1234567.5',
      trend: 'En hausse de 12 %',
      direction: 'up' as const,
    },
    {
      label: 'Indicateur B',
      value: '980000',
      trend: 'En baisse de 3 %',
      direction: 'down' as const,
    },
    { label: 'Indicateur C', value: '0', trend: 'Stable', direction: 'flat' as const },
  ];

  readonly demoForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<string | null>(null),
    contribuable: new FormControl<string | null>(null),
  });

  readonly guideSteps: readonly GuideStep[] = [
    {
      label: 'Identification',
      description: 'Renseigner les champs obligatoires.',
      status: 'current',
    },
    { label: 'Pieces jointes', description: 'Ajouter au moins un document.', status: 'pending' },
    { label: 'Verification', description: 'Controler les informations.', status: 'pending' },
  ];

  readonly columns: readonly DataTableColumn<DemoRow>[] = [
    { key: 'reference' as const, header: 'Reference', sortable: true },
    { key: 'label' as const, header: 'Libelle', sortable: true },
    {
      key: 'status' as const,
      header: 'Statut',
      format: (row: DemoRow) => resolveStatus(row.status).label,
    },
    {
      key: 'amount' as const,
      header: 'Montant',
      align: 'right' as const,
      format: (row: DemoRow) => formatFcfa(row.amount),
    },
    { key: 'date' as const, header: 'Date', sortable: true },
  ];

  readonly tableState = signal<TableState>(this.tableQuery.read());
  readonly tableVariant = signal<TableVariant>('success');
  readonly tableLoading = computed(() => this.tableVariant() === 'loading');
  readonly tableProblem = computed(() => (this.tableVariant() === 'error' ? DEMO_PROBLEM : null));
  readonly tableRows = computed(() => {
    if (this.tableVariant() === 'empty') {
      return [] as readonly DemoRow[];
    }

    const state = this.tableState();
    const query = (state.filters['q'] ?? '').toLowerCase();
    let rows = DEMO_ROWS.filter(
      (row) =>
        !query ||
        row.reference.toLowerCase().includes(query) ||
        row.label.toLowerCase().includes(query),
    );

    if (state.sort) {
      const key = state.sort;
      rows = [...rows].sort((left, right) => {
        const leftValue = String(left[key as keyof DemoRow]);
        const rightValue = String(right[key as keyof DemoRow]);
        const result = leftValue.localeCompare(rightValue, 'fr');
        return state.direction === 'asc' ? result : -result;
      });
    }

    const start = (state.page - 1) * state.pageSize;
    return rows.slice(start, start + state.pageSize);
  });
  readonly tableTotal = computed(() => {
    if (this.tableVariant() === 'empty') {
      return 0;
    }
    const query = (this.tableState().filters['q'] ?? '').toLowerCase();
    return DEMO_ROWS.filter(
      (row) =>
        !query ||
        row.reference.toLowerCase().includes(query) ||
        row.label.toLowerCase().includes(query),
    ).length;
  });

  readonly rowKey = (row: DemoRow) => row.id;
  readonly confirmOpen = signal(false);
  readonly confirmInputOpen = signal(false);

  constructor() {
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
  }

  ngOnDestroy(): void {
    if (this.uploadTimer !== null) {
      window.clearInterval(this.uploadTimer);
    }
  }

  onTableState(state: TableState): void {
    this.tableState.set(state);
    this.tableQuery.write(state);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const state = this.tableState();
    const filters = { ...state.filters, q: value };
    this.tableState.set({ ...state, page: 1, filters });
    this.tableQuery.write({ ...state, page: 1, filters });
  }

  setTableVariant(variant: TableVariant): void {
    this.tableVariant.set(variant);
  }

  resetTable(): void {
    this.tableVariant.set('success');
  }

  showErrorToast(): void {
    this.notifications.showProblem(DEMO_PROBLEM);
  }

  showSuccessToast(): void {
    this.notifications.success('Demonstration', 'Operation simulee avec succes.');
  }

  simulateUpload(): void {
    if (this.uploadTimer !== null) {
      window.clearInterval(this.uploadTimer);
    }

    this.uploadProgress.start();
    this.uploadTimer = window.setInterval(() => {
      const next = Math.min(100, this.uploadProgress.value() + 12);
      this.uploadProgress.set(next);
      if (next >= 100) {
        if (this.uploadTimer !== null) {
          window.clearInterval(this.uploadTimer);
          this.uploadTimer = null;
        }
        this.uploadProgress.finish();
      }
    }, 180);
  }

  onConfirmed(): void {
    this.confirmOpen.set(false);
    this.notifications.success('Confirmation', 'Action de demonstration confirmee.');
  }

  onInputConfirmed(value: string): void {
    this.confirmInputOpen.set(false);
    this.notifications.success(
      'Motif enregistre',
      `Motif de demonstration (${value.length} caracteres).`,
    );
  }
}
