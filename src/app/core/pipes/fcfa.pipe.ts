import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { formatFcfa } from '../utils/format-fcfa';

@Pipe({ name: 'fcfa', standalone: true, pure: true })
export class FcfaPipe implements PipeTransform {
  transform(value: string | number | null | undefined, withCurrency = true): string {
    return formatFcfa(value, withCurrency);
  }
}
