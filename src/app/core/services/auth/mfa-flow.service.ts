import { Injectable, signal } from '@angular/core';

export interface MfaFlowState {
  challengeToken: string;
  enrollmentRequired: boolean;
}

@Injectable({ providedIn: 'root' })
export class MfaFlowService {
  private readonly challengeState = signal<MfaFlowState | null>(null);
  private readonly recoveryCodesState = signal<string[] | null>(null);

  readonly challenge = this.challengeState.asReadonly();
  readonly recoveryCodes = this.recoveryCodesState.asReadonly();

  setChallenge(state: MfaFlowState): void {
    this.challengeState.set(state);
  }

  setRecoveryCodes(codes: string[]): void {
    this.recoveryCodesState.set(codes);
  }

  clearRecoveryCodes(): void {
    this.recoveryCodesState.set(null);
  }

  clear(): void {
    this.challengeState.set(null);
    this.recoveryCodesState.set(null);
  }
}
