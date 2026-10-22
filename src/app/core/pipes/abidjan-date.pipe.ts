import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({ name: 'abidjanDate', standalone: true, pure: true })
export class AbidjanDatePipe implements PipeTransform {
  private readonly formatter = new Intl.DateTimeFormat('fr-CI', {
    timeZone: 'Africa/Abidjan',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return this.formatter.format(date);
  }
}
