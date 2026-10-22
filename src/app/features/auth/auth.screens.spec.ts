import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PasswordInputComponent } from '../../core/components/password-input/password-input.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { MyProfileComponent } from './my-profile/my-profile.component';

const user = {
  id: 'u',
  login: 'agent',
  displayName: 'Agent',
  roles: ['AGENT_GUDEF'],
  permissions: ['CAN_READ_OWN_PROFILE'],
  mustChangePassword: false,
};

function authMock() {
  return {
    login: vi.fn(() =>
      of({
        accessToken: 'a',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user,
      }),
    ),
    forgotPassword: vi.fn(() => of(void 0)),
    resetPassword: vi.fn(() => of(void 0)),
    changePassword: vi.fn(() => of(void 0)),
    currentUser: vi.fn(() => user),
    markPasswordChanged: vi.fn(),
    logoutAndRedirect: vi.fn(),
  };
}

function commonProviders(auth: ReturnType<typeof authMock>, token = '') {
  return [
    provideRouter([]),
    provideHttpClient(),
    { provide: AuthService, useValue: auth },
    PermissionsService,
    CorrelationService,
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
    },
  ];
}

describe('Auth screens', () => {
  it('login soumet les identifiants et navigue vers dashboard', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(LoginComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({ login: 'agent', password: 'Correct-Horse-2026!' });

    fixture.componentInstance.submit();

    expect(auth.login).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('forgot affiche toujours le meme succes', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.form.setValue({ login: 'agent' });

    fixture.componentInstance.submit();

    expect(auth.forgotPassword).toHaveBeenCalledWith('agent');
    expect(fixture.componentInstance.sent()).toBe(true);
  });

  it('reset refuse un lien sans token', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      newPassword: 'New-Correct-Horse-2026!',
      confirmation: 'New-Correct-Horse-2026!',
    });

    fixture.componentInstance.submit();

    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('reset soumet le token et le nouveau mot de passe', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: commonProviders(auth, 'reset-token-value'),
    });
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      newPassword: 'New-Correct-Horse-2026!',
      confirmation: 'New-Correct-Horse-2026!',
    });

    fixture.componentInstance.submit();

    expect(auth.resetPassword).toHaveBeenCalledWith('reset-token-value', 'New-Correct-Horse-2026!');
  });

  it('profil change le mot de passe et met a jour mustChangePassword', () => {
    const auth = authMock();
    const permissions = new PermissionsService();
    permissions.load({ ...user, mustChangePassword: true });
    TestBed.configureTestingModule({
      imports: [MyProfileComponent],
      providers: [...commonProviders(auth), { provide: PermissionsService, useValue: permissions }],
    });
    const fixture = TestBed.createComponent(MyProfileComponent);
    fixture.componentInstance.form.setValue({
      currentPassword: 'Current-Horse-2026!',
      newPassword: 'New-Correct-Horse-2026!',
      confirmation: 'New-Correct-Horse-2026!',
    });

    fixture.componentInstance.submit();

    expect(auth.changePassword).toHaveBeenCalledOnce();
    expect(auth.markPasswordChanged).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.success()).toBe(true);
  });

  it('login refuse un formulaire incomplet', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(LoginComponent);

    fixture.componentInstance.submit();

    expect(auth.login).not.toHaveBeenCalled();
    expect(fixture.componentInstance.invalid('login')).toBe(true);
  });

  it('login redirige vers le profil si changement obligatoire', () => {
    const auth = authMock();
    auth.login.mockReturnValue(
      of({
        accessToken: 'a',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user: { ...user, mustChangePassword: true },
      }),
    );
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(LoginComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({ login: 'agent', password: 'Correct-Horse-2026!' });

    fixture.componentInstance.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/my-profile'], {
      queryParams: { mustChange: '1' },
    });
  });

  it('login expose problem+json sans fuite technique', () => {
    const auth = authMock();
    auth.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: {
              type: 'urn:pdref:error:UNAUTHENTICATED',
              title: 'Identifiants invalides',
              status: 401,
              code: 'UNAUTHENTICATED',
              traceId: 'trace-1',
            },
          }),
      ),
    );
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ login: 'agent', password: 'Wrong-Password-2026!' });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.problem()?.code).toBe('UNAUTHENTICATED');
  });

  it('forgot refuse un identifiant vide et gere une erreur reseau', () => {
    const auth = authMock();
    auth.forgotPassword.mockReturnValue(throwError(() => new Error('reseau')));
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(ForgotPasswordComponent);

    fixture.componentInstance.submit();
    expect(auth.forgotPassword).not.toHaveBeenCalled();

    fixture.componentInstance.form.setValue({ login: 'agent' });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.problem()).not.toBeNull();
  });

  it('reset refuse une confirmation differente et gere une erreur', () => {
    const auth = authMock();
    auth.resetPassword.mockReturnValue(throwError(() => new Error('reseau')));
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: commonProviders(auth, 'reset-token-value'),
    });
    const fixture = TestBed.createComponent(ResetPasswordComponent);

    fixture.componentInstance.form.setValue({
      newPassword: 'New-Correct-Horse-2026!',
      confirmation: 'Different-Horse-2026!',
    });
    fixture.componentInstance.submit();
    expect(auth.resetPassword).not.toHaveBeenCalled();

    fixture.componentInstance.form.setValue({
      newPassword: 'New-Correct-Horse-2026!',
      confirmation: 'New-Correct-Horse-2026!',
    });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.problem()).not.toBeNull();
  });

  it('profil refuse un formulaire invalide et permet la deconnexion', () => {
    const auth = authMock();
    TestBed.configureTestingModule({
      imports: [MyProfileComponent],
      providers: commonProviders(auth),
    });
    const fixture = TestBed.createComponent(MyProfileComponent);

    fixture.componentInstance.submit();
    expect(auth.changePassword).not.toHaveBeenCalled();
    expect(fixture.componentInstance.invalid('currentPassword')).toBe(true);

    fixture.componentInstance.logout();
    expect(auth.logoutAndRedirect).toHaveBeenCalledOnce();
  });
  it('password input bascule la visibilite et signale les majuscules', () => {
    TestBed.configureTestingModule({
      imports: [PasswordInputComponent],
    });
    const fixture = TestBed.createComponent(PasswordInputComponent);
    fixture.componentRef.setInput('label', 'Mot de passe');
    fixture.componentRef.setInput('inputId', 'test-password');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(input.type).toBe('password');

    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.capsLock()).toBe(false);
  });
});
