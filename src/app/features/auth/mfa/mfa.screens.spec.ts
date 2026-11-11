import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MfaFlowService } from '../../../core/services/auth/mfa-flow.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { MfaEnrollComponent } from './mfa-enroll.component';
import { MfaRecoveryCodesComponent } from './mfa-recovery-codes.component';
import { MfaVerifyComponent } from './mfa-verify.component';

const session = {
  accessToken: 'a',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: {
    id: 'u',
    login: 'agent',
    displayName: 'Agent',
    roles: [],
    permissions: [],
    mustChangePassword: false,
  },
};

function authMock() {
  return {
    startMfaEnrollment: vi.fn(() =>
      of({
        secret: 'JBSWY3DPEHPK3PXP',
        otpAuthUri: 'otpauth://totp/PDREF:agent',
        qrCodeDataUri: 'data:image/png;base64,abc',
      }),
    ),
    confirmMfaEnrollment: vi.fn(() => of({ session, recoveryCodes: ['AAAAA-BBBBB'] })),
    verifyMfa: vi.fn(() => of(session)),
    regenerateRecoveryCodes: vi.fn(() => of(['CCCCC-DDDDD'])),
  };
}

function providers(auth: ReturnType<typeof authMock>) {
  return [
    provideRouter([]),
    { provide: AuthService, useValue: auth },
    { provide: CorrelationService, useValue: { last: null } },
  ];
}

describe('MFA screens', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('verifie un code puis navigue vers le tableau de bord', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [MfaVerifyComponent],
      providers: providers(auth),
    });
    TestBed.inject(MfaFlowService).setChallenge({
      challengeToken: 'challenge',
      enrollmentRequired: false,
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(MfaVerifyComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ code: '123456' });

    component.submit();

    expect(auth.verifyMfa).toHaveBeenCalledWith('challenge', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('bascule en code de secours et annule le flux', () => {
    TestBed.configureTestingModule({
      imports: [MfaVerifyComponent],
      providers: providers(authMock()),
    });
    TestBed.inject(MfaFlowService).setChallenge({
      challengeToken: 'challenge',
      enrollmentRequired: false,
    });
    const fixture = TestBed.createComponent(MfaVerifyComponent);
    fixture.componentInstance.toggleMode();
    expect(fixture.componentInstance.recoveryMode()).toBe(true);
    fixture.componentInstance.cancel();
    expect(TestBed.inject(MfaFlowService).challenge()).toBeNull();
  });

  it('affiche le secret, confirme le premier code et stocke les codes de secours', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [MfaEnrollComponent],
      providers: providers(auth),
    });
    const flow = TestBed.inject(MfaFlowService);
    flow.setChallenge({ challengeToken: 'challenge', enrollmentRequired: true });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(MfaEnrollComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.material()?.secret).toBe('JBSWY3DPEHPK3PXP');
    component.form.setValue({ code: '123456' });

    component.submit();

    expect(auth.confirmMfaEnrollment).toHaveBeenCalledWith('challenge', '123456');
    expect(flow.recoveryCodes()).toEqual(['AAAAA-BBBBB']);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/mfa/recovery-codes']);
  });

  it('copie, telecharge, regenere et termine les codes de secours', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [MfaRecoveryCodesComponent],
      providers: providers(auth),
    });
    const flow = TestBed.inject(MfaFlowService);
    flow.setChallenge({ challengeToken: 'challenge', enrollmentRequired: false });
    flow.setRecoveryCodes(['AAAAA-BBBBB']);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:codes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(MfaRecoveryCodesComponent);
    fixture.componentInstance.copyAll();
    fixture.componentInstance.download();
    fixture.componentInstance.regenerate();

    expect(writeText).toHaveBeenCalled();
    expect(auth.regenerateRecoveryCodes).toHaveBeenCalledOnce();
    expect(flow.recoveryCodes()).toEqual(['CCCCC-DDDDD']);
    fixture.componentInstance.finish();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
