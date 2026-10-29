import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdminGateway } from '../../core/services/admin/admin.gateway';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { AdminPageComponent } from './admin-page.component';

const directionPage = {
  items: [
    {
      id: 'd1',
      code: 'GUDEF',
      libelle: 'GUDEF',
      type: 'SERVICE',
      fonctionCircuit: 'GUDEF',
      parentDirectionCode: null,
      email: null,
      telephone: null,
      adresse: null,
      isActive: true,
      provisional: true,
      legacy: false,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      version: 1,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 25,
};

function setup(screen = 'directions', manage = true) {
  TestBed.resetTestingModule();
  const gateway = {
    directions: vi.fn(() => of(directionPage)),
    createDirection: vi.fn(() => of(directionPage.items[0])),
    updateDirection: vi.fn(() => of(directionPage.items[0])),
    setDirectionActive: vi.fn(() => of({})),
    fiscalYears: vi.fn(() => of({ items: [], total: 0, page: 1, pageSize: 25 })),
    values: vi.fn(() => of({ items: [], total: 0, page: 1, pageSize: 25 })),
    parameters: vi.fn(() => of({ items: [], total: 0, page: 1, pageSize: 25 })),
    templates: vi.fn(() => of({ items: [], total: 0, page: 1, pageSize: 25 })),
    parameterHistory: vi.fn(() => of([])),
    createParameterVersion: vi.fn(() => of({})),
    setValueActive: vi.fn(() => of({})),
    setFiscalYearActive: vi.fn(() => of({})),
    updateValue: vi.fn(() => of({})),
    createValue: vi.fn(() => of({})),
    createTemplate: vi.fn(() => of({})),
    updateTemplate: vi.fn(() => of({})),
    createFiscalYear: vi.fn(() => of({})),
    updateFiscalYear: vi.fn(() => of({})),
  };
  const permissions = new PermissionsService();
  permissions.load({
    id: 'u',
    login: 'u',
    displayName: 'u',
    roles: ['ADMINISTRATEUR_DSI'],
    permissions: manage
      ? [
          'Directions_Read',
          'Directions_Manage',
          'Exercices_Read',
          'Exercices_Manage',
          'Listes_Read',
          'Listes_Manage',
          'Parametres_Read',
          'Parametres_Manage',
          'ModelesNotifications_Read',
          'ModelesNotifications_Manage',
        ]
      : ['Directions_Read'],
    mustChangePassword: false,
  });

  TestBed.configureTestingModule({
    imports: [AdminPageComponent],
    providers: [
      { provide: AdminGateway, useValue: gateway },
      { provide: PermissionsService, useValue: permissions },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { screen } } },
      },
    ],
  });

  return { fixture: TestBed.createComponent(AdminPageComponent), gateway };
}

describe('AdminPageComponent', () => {
  it('charge les directions et expose les actions admin', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();

    expect(gateway.directions).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.items()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('GUDEF');
    expect(fixture.nativeElement.textContent).toContain('Provisoire');
  });

  it('refuse les mutations sans permission Manage', () => {
    const { fixture } = setup('directions', false);
    fixture.detectChanges();

    expect(fixture.componentInstance.canManage()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Ajouter');
  });

  it('ouvre et soumet une nouvelle direction', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.openCreate();
    fixture.componentInstance.form.patchValue({ code: 'DGE', libelle: 'DGE' });
    fixture.componentInstance.submit();

    expect(gateway.createDirection).toHaveBeenCalledOnce();
  });

  it('reinitialise les filtres et pagine', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.filters.patchValue({ search: 'GUDEF' });
    fixture.componentInstance.reset();
    fixture.componentInstance.nextPage();
    fixture.componentInstance.previousPage();

    expect(gateway.directions).toHaveBeenCalledTimes(2);
  });

  it('charge l historique d un parametre et formate sa valeur', () => {
    const { fixture, gateway } = setup('parametres');
    fixture.detectChanges();
    const parameter = {
      id: 'p1',
      cle: 'delais.verifGudefJO',
      domaine: 'delais',
      libelle: 'Delai',
      type: 'INT',
      unite: 'JO',
      min: 0,
      max: 60,
      provisional: true,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      currentVersion: null,
    };
    fixture.componentInstance.selectParameter(parameter);
    expect(gateway.parameterHistory).toHaveBeenCalledWith('delais.verifGudefJO');
    expect(fixture.componentInstance.formatValue(parameter)).toBe('Non fourni');
  });

  it('cree une version de parametre avec date et motif', () => {
    const { fixture, gateway } = setup('parametres');
    fixture.detectChanges();
    fixture.componentInstance.selectParameter({
      id: 'p1',
      cle: 'delais.verifGudefJO',
      domaine: 'delais',
      libelle: 'Delai',
      type: 'INT',
      unite: 'JO',
      min: 0,
      max: 60,
      provisional: true,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      currentVersion: null,
    });
    fixture.componentInstance.form.patchValue({
      valeurJson: '4',
      effectiveFrom: '2026-11-01',
      motif: 'Revision',
    });
    fixture.componentInstance.submit();

    expect(gateway.createParameterVersion).toHaveBeenCalled();
  });

  it('desactive une valeur de liste', () => {
    const { fixture, gateway } = setup('listes-valeurs');
    fixture.detectChanges();
    const value = {
      id: 'v1',
      listeCode: 'MOTIFS_REJET',
      code: 'EMAIL_NON_DECLARE',
      libelle: 'Email non declare',
      ordre: 1,
      isActive: true,
      selectable: false,
      legacy: true,
      provisional: true,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      metadonnees: null,
      version: 1,
    };
    fixture.componentInstance.toggle(value);

    expect(gateway.setValueActive).toHaveBeenCalledWith('v1', false, expect.any(String));
  });
  it('edite un exercice et bascule son etat', () => {
    const { fixture, gateway } = setup('exercices');
    fixture.detectChanges();
    const year = {
      id: 'y1',
      annee: 2025,
      libelle: '2025',
      dateOuverture: '2025-01-01T00:00:00Z',
      dateCloture: '2025-12-31T00:00:00Z',
      isActive: true,
      provisional: true,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      version: 1,
    };
    fixture.componentInstance.edit(year);
    expect(fixture.componentInstance.form.controls.annee.value).toBe(2025);
    fixture.componentInstance.toggle(year);
    expect(gateway.setFiscalYearActive).toHaveBeenCalled();
  });

  it('edite une valeur et un modele', () => {
    const { fixture } = setup('listes-valeurs');
    fixture.detectChanges();
    fixture.componentInstance.edit({
      id: 'v1',
      listeCode: 'MOTIFS_REJET',
      code: 'X',
      libelle: 'X',
      ordre: 1,
      isActive: true,
      selectable: false,
      legacy: true,
      provisional: true,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      metadonnees: null,
      version: 1,
    });
    expect(fixture.componentInstance.form.controls.listeCode.value).toBe('MOTIFS_REJET');

    const templates = setup('modeles-notifications');
    templates.fixture.detectChanges();
    templates.fixture.componentInstance.edit({
      id: 't1',
      code: 'DEPOT',
      canal: 'EMAIL',
      langue: 'fr',
      versionModele: 1,
      sujet: 'Sujet',
      corps: 'Corps',
      variablesAutorisees: ['nom'],
      statut: 'BROUILLON',
      provisional: true,
      sourceRef: 'A/B',
      requiresConfirmation: true,
      version: 1,
    });
    expect(templates.fixture.componentInstance.form.controls.code.value).toBe('DEPOT');
  });

  it('soumet un exercice, une liste et un modele', () => {
    const years = setup('exercices');
    years.fixture.detectChanges();
    years.fixture.componentInstance.form.patchValue({
      annee: 2026,
      libelle: '2026',
      dateOuverture: '2026-01-01',
      dateCloture: '2026-12-31',
    });
    years.fixture.componentInstance.submit();
    expect(years.gateway.createFiscalYear).toHaveBeenCalled();

    const lists = setup('listes-valeurs');
    lists.fixture.detectChanges();
    lists.fixture.componentInstance.form.patchValue({ code: 'X', libelle: 'X' });
    lists.fixture.componentInstance.submit();
    expect(lists.gateway.createValue).toHaveBeenCalled();

    const templates = setup('modeles-notifications');
    templates.fixture.detectChanges();
    templates.fixture.componentInstance.form.patchValue({ code: 'X', sujet: 'S', corps: 'C' });
    templates.fixture.componentInstance.submit();
    expect(templates.gateway.createTemplate).toHaveBeenCalled();
  });

  it('ferme le formulaire et affiche une valeur de parametre', () => {
    const { fixture } = setup('parametres');
    fixture.detectChanges();
    fixture.componentInstance.openCreate();
    fixture.componentInstance.cancel();
    expect(fixture.componentInstance.showForm()).toBe(false);
    expect(
      fixture.componentInstance.formatValue({
        id: 'p',
        cle: 'x',
        domaine: 'x',
        libelle: 'x',
        type: 'INT',
        unite: null,
        min: null,
        max: null,
        provisional: true,
        sourceRef: null,
        requiresConfirmation: true,
        currentVersion: {
          id: 'v',
          cle: 'x',
          versionNumber: 1,
          valeurJson: 'valeur',
          effectiveFrom: '2026-01-01T00:00:00Z',
          effectiveTo: null,
          statut: 'ACTIVE',
          motifChangement: 'm',
          provisional: true,
          sourceRef: null,
        },
      }),
    ).toBe('valeur');
  });
  it('desactive une direction active', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.toggle(fixture.componentInstance.items()[0]);

    expect(gateway.setDirectionActive).toHaveBeenCalledWith('d1', false, expect.any(String));
  });
});
