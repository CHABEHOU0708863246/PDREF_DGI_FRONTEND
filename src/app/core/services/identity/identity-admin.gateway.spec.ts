import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { IdentityAdminGateway } from './identity-admin.gateway';

describe('IdentityAdminGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(IdentityAdminGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('couvre liste, roles et creation', () => {
    const { gateway, http } = setup();

    gateway
      .users({
        search: 'agent',
        role: 'AGENT_GUDEF',
        directionId: 'GUDEF',
        isActive: true,
        page: 1,
        pageSize: 25,
      })
      .subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/users'));
    expect(list.request.params.get('search')).toBe('agent');
    expect(list.request.params.get('role')).toBe('AGENT_GUDEF');
    expect(list.request.params.get('directionId')).toBe('GUDEF');
    expect(list.request.params.get('isActive')).toBe('true');
    list.flush({ data: { items: [], total: 0, page: 1, pageSize: 25 } });

    gateway.roles().subscribe();
    http.expectOne((request) => request.url.endsWith('/roles')).flush({ data: [] });

    gateway
      .create({
        firstName: 'Agent',
        lastName: 'GUDEF',
        email: 'agent@test.ci',
        matricule: 'agent.gudef',
        fonction: 'Agent',
        directionId: 'dir-gudef',
        directionCode: 'GUDEF',
        roleKeys: ['AGENT_GUDEF'],
      })
      .subscribe();
    const create = http.expectOne(
      (request) => request.url.endsWith('/users') && request.method === 'POST',
    );
    expect(create.request.body.matricule).toBe('agent.gudef');
    create.flush({ data: { id: 'u1' } });

    http.verify();
  });

  it('couvre modification, direction, roles et cycle de vie', () => {
    const { gateway, http } = setup();

    gateway
      .update('u1', {
        firstName: 'Agent',
        lastName: 'GUDEF',
        email: 'agent@test.ci',
        matricule: 'agent.gudef',
        fonction: 'Agent',
      })
      .subscribe();
    http
      .expectOne((request) => request.url.endsWith('/users/u1') && request.method === 'PUT')
      .flush({ data: { id: 'u1' } });

    gateway.updateDirection('u1', 'dir-gudef', 'GUDEF').subscribe();
    const direction = http.expectOne(
      (request) => request.url.endsWith('/users/u1/direction') && request.method === 'PUT',
    );
    expect(direction.request.body).toEqual({ directionId: 'dir-gudef', directionCode: 'GUDEF' });
    direction.flush({ data: { id: 'u1' } });

    gateway.updateRoles('u1', ['AGENT_GUDEF']).subscribe();
    const roles = http.expectOne(
      (request) => request.url.endsWith('/users/u1/roles') && request.method === 'PUT',
    );
    expect(roles.request.body).toEqual({ roles: ['AGENT_GUDEF'] });
    roles.flush({ data: {} });

    gateway.deactivate('u1').subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/users/u1/deactivate') && request.method === 'POST',
      )
      .flush({ data: { assignedDossiersCount: 0, reattributionTaskCreated: false } });

    gateway.activate('u1').subscribe();
    http
      .expectOne((request) => request.url.endsWith('/users/u1/enable') && request.method === 'POST')
      .flush({ data: {} });

    gateway.resendInvitation('u1').subscribe();
    http
      .expectOne(
        (request) => request.url.endsWith('/users/u1/invitation') && request.method === 'POST',
      )
      .flush({ data: {} });

    http.verify();
  });
});
