import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCenterService } from '../../services/notifications/notification-center.service';
import { NotificationCenterComponent } from './notification-center.component';

function setup() {
  const service = {
    items: vi.fn(() => []),
    unreadCount: vi.fn(() => 0),
    hasUnread: vi.fn(() => false),
    loading: vi.fn(() => false),
    problem: vi.fn(() => null),
    load: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [NotificationCenterComponent],
    providers: [{ provide: NotificationCenterService, useValue: service }],
  });
  return { fixture: TestBed.createComponent(NotificationCenterComponent), service };
}

describe('NotificationCenterComponent', () => {
  it('ouvre le panneau et expose les attributs ARIA', () => {
    const { fixture, service } = setup();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#notification-panel')).not.toBeNull();
    expect(service.load).toHaveBeenCalled();
  });

  it('ferme le panneau avec Escape', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
it('ne vole pas le focus quand le panneau est deja ferme', () => {
  const { fixture } = setup();
  fixture.detectChanges();
  const component = fixture.componentInstance;
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const focus = vi.spyOn(button, 'focus');

  component.onDocumentClick(new MouseEvent('click', { bubbles: true }));

  expect(focus).not.toHaveBeenCalled();
});
