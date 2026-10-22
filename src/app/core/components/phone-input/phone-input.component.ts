import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import {
  DEFAULT_PHONE_ISO,
  PHONE_COUNTRIES,
  formatReadablePhone,
  splitE164,
  toE164,
} from '../../utils/phone.util';

@Component({
  selector: 'pdref-phone-input',
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="phone-input">
      @if (label()) {
        <label class="pd-label" [for]="'phone-' + inputId()">{{ label() }}</label>
      }

      <div class="phone-input__row">
        <select
          class="pd-input phone-input__country"
          [value]="iso()"
          [disabled]="disabled()"
          aria-label="Indicatif du pays"
          (change)="onCountryChange($event)"
        >
          @for (country of countries; track country.iso) {
            <option [value]="country.iso">{{ country.dialCode }} — {{ country.name }}</option>
          }
        </select>

        <input
          class="pd-input phone-input__number"
          [id]="'phone-' + inputId()"
          type="tel"
          inputmode="tel"
          autocomplete="tel-national"
          [value]="national()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [attr.aria-invalid]="error() !== null"
          [attr.aria-describedby]="error() ? 'phone-error-' + inputId() : null"
          (input)="onNationalInput($event)"
        />
      </div>

      @if (error()) {
        <p [id]="'phone-error-' + inputId()" class="pd-error" role="alert">{{ error() }}</p>
      } @else if (e164()) {
        <p class="pd-help">{{ display() }}</p>
      }
    </div>
  `,
  styleUrl: './phone-input.component.scss',
})
export class PhoneInputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('07 00 00 00 00');
  readonly inputId = input('phone');

  readonly countries = PHONE_COUNTRIES;
  readonly iso = signal<string>(DEFAULT_PHONE_ISO);
  readonly national = signal('');
  readonly e164 = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly disabled = signal(false);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (!value) {
      this.national.set('');
      this.e164.set(null);
      this.error.set(null);
      return;
    }

    const { iso, national } = splitE164(value);
    this.iso.set(iso);
    this.national.set(national);
    this.e164.set(value);
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

  onCountryChange(event: Event): void {
    this.iso.set((event.target as HTMLSelectElement).value);
    this.recompute();
  }

  onNationalInput(event: Event): void {
    this.national.set((event.target as HTMLInputElement).value);
    this.recompute();
  }

  display(): string {
    return formatReadablePhone(this.e164());
  }

  private recompute(): void {
    this.onTouched();
    const raw = this.national().trim();
    if (!raw) {
      this.error.set(null);
      this.e164.set(null);
      this.onChange(null);
      return;
    }

    const result = toE164(raw, this.iso());
    if (!result.ok) {
      this.error.set(result.reason);
      this.e164.set(null);
      this.onChange(null);
      return;
    }

    this.error.set(null);
    this.e164.set(result.e164);
    this.onChange(result.e164);
  }
}
