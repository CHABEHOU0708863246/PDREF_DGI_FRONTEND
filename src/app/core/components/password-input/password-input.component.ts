import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-password-input',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="pd-field">
      <label class="pd-label" [attr.for]="inputId()">{{ label() }}</label>
      <div class="password-wrap">
        <input
          class="pd-input"
          [id]="inputId()"
          [type]="visible() ? 'text' : 'password'"
          [value]="value()"
          [attr.autocomplete]="autocomplete()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (keydown)="onKeydown($event)"
          (keyup)="onKeydown($event)"
        />
        <button
          type="button"
          class="password-toggle"
          [attr.aria-label]="visible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          [attr.aria-pressed]="visible()"
          [disabled]="disabled()"
          (click)="toggle()"
        >
          <pdref-icon [name]="visible() ? 'eye-off' : 'eye'" />
        </button>
      </div>
      @if (hint()) {
        <p class="pd-field__hint" [id]="hintId()">{{ hint() }}</p>
      }
      @if (error()) {
        <p class="pd-field__error" [id]="errorId()" role="alert">{{ error() }}</p>
      }
      @if (capsLock()) {
        <p class="pd-field__hint" aria-live="polite">Verrouillage des majuscules actif.</p>
      }
    </div>
  `,
  styleUrl: './password-input.component.scss',
})
export class PasswordInputComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly autocomplete = input('current-password');

  readonly value = signal('');
  readonly visible = signal(false);
  readonly disabled = signal(false);
  readonly capsLock = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    this.visible.update((visible) => !visible);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    this.capsLock.set(event.getModifierState('CapsLock'));
  }

  describedBy(): string | null {
    const ids = [this.hint() ? this.hintId() : null, this.error() ? this.errorId() : null].filter(
      (value): value is string => value !== null,
    );
    return ids.length > 0 ? ids.join(' ') : null;
  }

  hintId(): string {
    return `${this.inputId()}-hint`;
  }

  errorId(): string {
    return `${this.inputId()}-error`;
  }
}
