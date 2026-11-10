import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminGateway } from '../../core/services/admin/admin.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { IdentityAdminGateway } from '../../core/services/identity/identity-admin.gateway';
import { UsersPageComponent } from './users-page.component';

const user = {
  id: 'u1',
  login: 'agent.dvfn',
  displayName: 'Agent DVFN',
  firstName: 'Agent',
  lastName: 'DVFN',
  emailMasked: 'a***@test.ci',
  matricule: 'agent.dvfn',
  fonction: 'Decideur',
  directionId: 'dir-dvfn',
  directionCode: 'DVFN',
  isActive: true,
  isLocked: false,
  assignedDossiersCount: 2,
  roles: ['DECIDEUR_DVFN'],
};

const direction = {
  id: 'dir-dvfn',
  code: 'DVFN',
  libelle: 'Direction DVFN',
  type: 'SERVICE',
  fonctionCircuit: 'DVFN',
  parentDirectionCode: null,
  email: null,
  telephone: null,
  adresse: null,
  isActive: true,
  provisional: false,
  legacy: false,
  sourceRef: null,
  requiresConfirmation: false,
  version: 1,
};

const role = {
  key: 'DECIDEUR_DVFN',
  name: 'Decideur DVFN',
  description: '',
  scope: 'direction',
  permissions: ['Avis_Emettre'],
};

function providers(identity: Partial<IdentityAdminGateway>) {
  return [
    provideRouter([]),
    { provide: IdentityAdminGateway, useValue: identity },
    {
      provide: AdminGateway,
      useValue: {
        directions: vi.fn(() => of({ items: [direction], total: 1, page: 1, pageSize: 100 })),
      },
    },
    { provide: CorrelationService, useValue: { last: null } },
  ];
}

describe('UsersPageComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche la liste et les quatre etats', () => {
    TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: providers({
        users: vi.fn(() => of({ items: [user], total: 1, page: 1, pageSize: 25 })),
        roles: vi.fn(() => of([role])),
      }),
    });
    const fixture = TestBed.createComponent(UsersPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Agent DVFN');
    expect(fixture.nativeElement.textContent).toContain('a***@test.ci');
    expect(fixture.nativeElement.textContent).toContain('2 dossier(s)');
  });

  it('cree un utilisateur sans mot de passe', () => {
    const create = vi.fn(() => of(user));
    TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: providers({
        users: vi.fn(() => of({ items: [], total: 0, page: 1, pageSize: 25 })),
        roles: vi.fn(() => of([role])),
        create,
      }),
    });
    const fixture = TestBed.createComponent(UsersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.openCreate();
    component.form.setValue({
      firstName: 'Agent',
      lastName: 'DVFN',
      email: 'agent@test.ci',
      matricule: 'agent.dvfn',
      fonction: 'Decideur',
      directionId: 'dir-dvfn',
    });
    component.toggleRole('DECIDEUR_DVFN');
    component.submit();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ matricule: 'agent.dvfn', roleKeys: ['DECIDEUR_DVFN'] }),
    );
  });

  it('modifie, desactive et renvoie une invitation', () => {
    const update = vi.fn(() => of(user));
    const deactivate = vi.fn(() =>
      of({ assignedDossiersCount: 0, reattributionTaskCreated: false }),
    );
    const resendInvitation = vi.fn(() => of({}));
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: providers({
        users: vi.fn(() => of({ items: [user], total: 1, page: 1, pageSize: 25 })),
        roles: vi.fn(() => of([role])),
        update,
        deactivate,
        resendInvitation,
      }),
    });
    const fixture = TestBed.createComponent(UsersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.edit(user);
    component.form.patchValue({ email: 'agent@test.ci', fonction: 'Directeur' });
    component.submit();
    expect(update).toHaveBeenCalled();
    component.toggleActive(user);
    expect(deactivate).toHaveBeenCalledWith('u1');
    component.resend(user);
    expect(resendInvitation).toHaveBeenCalledWith('u1');
  });

  it('couvre les erreurs et la pagination', () => {
    TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: providers({
        users: vi.fn(() => throwError(() => new Error('offline'))),
        roles: vi.fn(() => of([role])),
      }),
    });
    const fixture = TestBed.createComponent(UsersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.error()).not.toBeNull();
    component.load(1);
    component.previousPage();
    component.nextPage();
    component.cancel();
    component.reset();
  });
});
