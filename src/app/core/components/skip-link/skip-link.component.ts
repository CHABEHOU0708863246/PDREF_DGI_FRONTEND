import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pdref-skip-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="pd-skip-link" href="#main-content">Aller au contenu principal</a>`,
})
export class SkipLinkComponent {}
