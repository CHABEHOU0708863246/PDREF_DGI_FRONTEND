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
import type { CourrierLookup } from '../../models/courriers/courrier.model';
import { CourriersGateway } from '../../services/courriers/courriers.gateway';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-courrier-select',
  standalone: true,
  imports: [FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CourrierSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contribuable-select" #root>
      @if (label()) {
        <label class="pd-label" [for]="'courrier-' + inputId()">{{ label() }}</label>
      }

      @if (selected(); as item) {
        <span class="pd-chip">
          {{ item.numero }}
          @if (item.objet) {
            <small>{{ item.objet }}</small>
          }
          <button
            type="button"
            class="pd-icon-btn"
            [attr.aria-label]="'Retirer ' + item.numero"
            (click)="clear()"
          >
            <pdref-icon name="close" size="sm" />
          </button>
        </span>
      } @else {
        <div class="contribuable-select__control">
          <input
            class="pd-input"
            [id]="'courrier-' + inputId()"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            [attr.aria-controls]="listboxId()"
            [attr.aria-expanded]="open()"
            [attr.aria-activedescendant]="activeOptionId()"
            [value]="term()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            (input)="onInput($event)"
            (focus)="open.set(true)"
            (keydown)="onKeydown($event)"
            (blur)="onBlur($event)"
          />
          @if (loading()) {
            <span class="contribuable-select__spinner" aria-hidden="true"></span>
          }
        </div>

        @if (
          open() && (loading() || error() || results().length > 0 || term().length >= minChars())
        ) {
          <div [id]="listboxId()" class="contribuable-select__list" role="listbox">
            @if (loading()) {
              <p class="contribuable-select__status" role="status">Recherche...</p>
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
                  [id]="optionId(option)"
                  role="option"
                  [attr.aria-selected]="selected()?.id === option.id"
                  [class.contribuable-select__option--active]="index === activeIndex()"
                  (mousedown)="$event.preventDefault()"
                  (click)="choose(option)"
                >
                  <strong>{{ option.numero }}</strong>
                  @if (option.objet) {
                    <small>{{ option.objet }}</small>
                  }
                </button>
              }
            }
          </div>
        }
      }
    </div>
  `,
  styleUrl: '../contribuable-select/contribuable-select.component.scss',
})
export class CourrierSelectComponent implements ControlValueAccessor {
  private readonly gateway = inject(CourriersGateway);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly search$ = new Subject<string>();
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly label = input('Courrier');
  readonly placeholder = input('Rechercher par numero ou objet...');
  readonly minChars = input(2);
  readonly inputId = input('courrier');

  readonly term = signal('');
  readonly results = signal<readonly CourrierLookup[]>([]);
  readonly selected = signal<CourrierLookup | null>(null);
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly activeIndex = signal(-1);
  readonly disabled = signal(false);

  readonly listboxId = () => `courrier-listbox-${this.inputId()}`;
  readonly activeOptionId = () => {
    const option = this.results()[this.activeIndex()];
    return option ? this.optionId(option) : null;
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
            return of([] as readonly CourrierLookup[]);
          }

          this.loading.set(true);
          this.error.set(false);
          return this.gateway.lookup(term.trim()).pipe(
            catchError(() => {
              this.error.set(true);
              return of([] as readonly CourrierLookup[]);
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

  optionId(option: CourrierLookup): string {
    return `courrier-option-${option.id}`;
  }

  writeValue(value: string | null): void {
    if (!value) {
      this.selected.set(null);
      return;
    }
    this.selected.set({
      id: value,
      numero: value,
      objet: '',
      sens: 'ENTRANT',
      typeCourrier: 'COURRIER',
      date: '',
    });
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

  onBlur(event?: FocusEvent): void {
    const next = (event?.relatedTarget as Node | null) ?? null;
    if (next && this.host.nativeElement.contains(next)) {
      return;
    }

    this.close();
  }

  choose(option: CourrierLookup): void {
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
