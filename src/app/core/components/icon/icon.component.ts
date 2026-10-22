import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconName } from '../../models/common/icon.model';

@Component({
  selector: 'pdref-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="pd-icon"
      [class.pd-icon--sm]="size() === 'sm'"
      [class.pd-icon--lg]="size() === 'lg'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      focusable="false"
    >
      @switch (name()) {
        @case ('alert-circle') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        }
        @case ('alert-triangle') {
          <path
            d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
          />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        }
        @case ('arrow-down') {
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        }
        @case ('arrow-up') {
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        }
        @case ('bell') {
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        }
        @case ('calendar') {
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        }
        @case ('check') {
          <path d="m20 6-11 11-5-5" />
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('chevron-left') {
          <path d="m15 18-6-6 6-6" />
        }
        @case ('chevron-right') {
          <path d="m9 18 6-6-6-6" />
        }
        @case ('clipboard') {
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('close') {
          <path d="M18 6 6 18M6 6l12 12" />
        }
        @case ('copy') {
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        }
        @case ('download') {
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        }
        @case ('external-link') {
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 4" />
          <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" />
        }
        @case ('file') {
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
        }
        @case ('filter') {
          <path d="M3 4h18l-7 8v6l-4 2v-8Z" />
        }
        @case ('home') {
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v11h14V10" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        }
        @case ('layout') {
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        }
        @case ('loader') {
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.9 4.9 2.8 2.8" />
          <path d="m16.3 16.3 2.8 2.8" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.9 19.1 2.8-2.8" />
          <path d="m16.3 7.7 2.8-2.8" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        }
        @case ('menu') {
          <path d="M4 6h16M4 12h16M4 18h16" />
        }
        @case ('minus') {
          <path d="M5 12h14" />
        }
        @case ('moon') {
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('refresh') {
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('sort') {
          <path d="m8 6 4-4 4 4" />
          <path d="M12 2v20" />
          <path d="m16 18-4 4-4-4" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        }
        @case ('trash') {
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 15H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        }
        @case ('upload') {
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        }
      }
    </svg>
  `,
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input<string>('');
}
