import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
} from 'rxjs';
import { CONTRIBUABLE_LOOKUP, type LookupOption } from '../../services/lookup/contribuable-lookup';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-contribuable-select',
  standalone: true,
  imports: [FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContribuableSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contribuable-select" #root>
      @if (label()) {
        <label class="pd-label" [for]="'contribuable-' + inputId()">{{ label() }}</label>
      }

      @if (selected(); as item) {
        <span class="pd-chip">
          {{ item.label }}
          @if (item.sub) {
            <small>{{ item.sub }}</small>
          }
          <button
            type="button"
            class="pd-icon-btn"
            [attr.aria-label]="'Retirer ' + item.label"
            (click)="clear()"
          >
            <pdref-icon name="close" size="sm" />
          </button>
        </span>
      } @else {
        <div class="contribuable-select__control">
          <input
            class="pd-input"
            [id]="'contribuable-' + inputId()"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="contribuable-listbox"
            [attr.aria-expanded]="open()"
            [attr.aria-activedescendant]="activeOptionId()"
            [value]="term()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            (input)="onInput($event)"
            (focus)="open.set(true)"
            (keydown)="onKeydown($event)"
            (blur)="onBlur()"
          />
          @if (loading()) {
            <span class="contribuable-select__spinner" aria-hidden="true"></span>
          }
        </div>

        @if (
          open() && (loading() || error() || results().length > 0 || term().length >= minChars())
        ) {
          <div id="contribuable-listbox" class="contribuable-select__list" role="listbox">
            @if (loading()) {
              <p class="contribuable-select__status" role="status">Recherche…</p>
            } @else if (error()) {
              <p
                class="contribuable-select__status contribuable-select__status--error"
                role="alert"
              >
                Recherche indisponible. Reessayez.
              </p>
            } @else if (results().length === 0) {
              <p class="contribuable-select__status">Aucun resultat.</p>
            } @else {
              @for (option of results(); track option.id; let index = $index) {
                <button
                  type="button"
                  class="contribuable-select__option"
                  [id]="'contribuable-option-' + option.id"
                  role="option"
                  [attr.aria-selected]="selected()?.id === option.id"
                  [class.contribuable-select__option--active]="index === activeIndex()"
                  (mousedown)="choose(option)"
                >
                  <strong>{{ option.label }}</strong>
                  @if (option.sub) {
                    <small>{{ option.sub }}</small>
                  }
                </button>
              }
            }
          </div>
        }
      }
    </div>
  `,
  styleUrl: './contribuable-select.component.scss',
})
export class ContribuableSelectComponent implements ControlValueAccessor {
  private readonly lookup = inject(CONTRIBUABLE_LOOKUP);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly search$ = new Subject<string>();
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly label = input('Contribuable');
  readonly placeholder = input('Rechercher par NCC ou raison sociale…');
  readonly minChars = input(2);
  readonly inputId = input('contribuable');

  readonly term = signal('');
  readonly results = signal<readonly LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly activeIndex = signal(-1);
  readonly disabled = signal(false);

  readonly activeOptionId = () => {
    const index = this.activeIndex();
    const option = this.results()[index];
    return option ? `contribuable-option-${option.id}` : null;
  };

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.trim().length < this.minChars()) {
            this.loading.set(false);
            this.error.set(false);
            return of([] as readonly LookupOption[]);
          }

          this.loading.set(true);
          this.error.set(false);
          return this.lookup.search(term.trim(), 8).pipe(
            catchError(() => {
              this.error.set(true);
              return of([] as readonly LookupOption[]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe((options) => {
        this.results.set(options);
        this.activeIndex.set(options.length > 0 ? 0 : -1);
        this.open.set(true);
      });
  }

  writeValue(value: string | null): void {
    if (!value) {
      this.selected.set(null);
      return;
    }

    this.selected.set({ id: value, label: value });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.term.set(value);
    this.open.set(true);
    this.onTouched();
    this.search$.next(value);
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.results();
    if (event.key === 'ArrowDown' && options.length > 0) {
      event.preventDefault();
      this.open.set(true);
      this.activeIndex.update((index) => Math.min(options.length - 1, index + 1));
      return;
    }

    if (event.key === 'ArrowUp' && options.length > 0) {
      event.preventDefault();
      this.activeIndex.update((index) => Math.max(0, index - 1));
      return;
    }

    if (event.key === 'Enter' && this.activeIndex() >= 0) {
      const option = options[this.activeIndex()];
      if (option) {
        event.preventDefault();
        this.choose(option);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.close();
    }
  }

  onBlur(): void {
    window.setTimeout(() => this.close(), 120);
  }

  choose(option: LookupOption): void {
    this.selected.set(option);
    this.term.set('');
    this.results.set([]);
    this.open.set(false);
    this.activeIndex.set(-1);
    this.onChange(option.id);
  }

  clear(): void {
    this.selected.set(null);
    this.term.set('');
    this.results.set([]);
    this.onChange(null);
  }

  close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
