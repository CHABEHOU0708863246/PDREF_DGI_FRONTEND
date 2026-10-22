import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import type { AbstractControl } from '@angular/forms';
import type { Subscription } from 'rxjs';

export interface GuideStep {
  label: string;
  description?: string;
  status: 'pending' | 'current' | 'done' | 'error';
}

@Component({
  selector: 'pdref-form-guide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="form-guide" aria-labelledby="form-guide-title">
      <header class="form-guide__head">
        <h2 id="form-guide-title">{{ title() }}</h2>
        <span class="form-guide__pct">{{ progress() }}%</span>
      </header>

      <div
        class="progress"
        role="progressbar"
        aria-label="Progression du formulaire"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="progress()"
      >
        <span class="progress__fill" [style.width.%]="progress()"></span>
      </div>

      <p class="form-guide__hint">{{ filled() }} / {{ total() }} champs obligatoires renseignes</p>

      <ol class="steps">
        @for (step of steps(); track step.label) {
          <li
            class="step"
            [class]="'step--' + step.status"
            [attr.aria-current]="step.status === 'current' ? 'step' : null"
          >
            <span class="step__dot" aria-hidden="true"></span>
            <span class="step__body">
              <strong>{{ step.label }}</strong>
              @if (step.description) {
                <small>{{ step.description }}</small>
              }
            </span>
          </li>
        }
      </ol>
    </section>
  `,
  styleUrl: './form-guide.component.scss',
})
export class FormGuideComponent {
  private readonly destroyRef = inject(DestroyRef);
  private subscription: Subscription | null = null;

  readonly title = input('Progression');
  readonly steps = input<readonly GuideStep[]>([]);
  readonly form = input<FormGroup | null>(null);

  readonly progress = signal(0);
  readonly filled = signal(0);
  readonly total = signal(0);

  constructor() {
    effect(() => {
      const form = this.form();
      this.subscription?.unsubscribe();
      this.subscription = null;

      if (!form) {
        this.progress.set(0);
        this.filled.set(0);
        this.total.set(0);
        return;
      }

      this.recompute(form);
      this.subscription = form.valueChanges.subscribe(() => this.recompute(form));
    });

    this.destroyRef.onDestroy(() => this.subscription?.unsubscribe());
  }

  private recompute(form: FormGroup): void {
    const required: AbstractControl[] = [];
    this.collectRequired(form, required);
    const total = required.length;
    const filled = required.filter((control) => this.isFilled(control)).length;
    this.total.set(total);
    this.filled.set(filled);
    this.progress.set(total === 0 ? 100 : Math.round((filled / total) * 100));
  }

  private collectRequired(control: AbstractControl, acc: AbstractControl[]): void {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach((child) => this.collectRequired(child, acc));
      return;
    }

    if (control instanceof FormArray) {
      if (control.hasValidator(Validators.required)) {
        acc.push(control);
      }
      control.controls.forEach((child) => this.collectRequired(child, acc));
      return;
    }

    if (
      control.hasValidator(Validators.required) ||
      control.hasValidator(Validators.requiredTrue)
    ) {
      acc.push(control);
    }
  }

  private isFilled(control: AbstractControl): boolean {
    if (control.disabled) {
      return true;
    }

    const value: unknown = control.value;
    if (value === null || value === undefined) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return true;
  }
}
