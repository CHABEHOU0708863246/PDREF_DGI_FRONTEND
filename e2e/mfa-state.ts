import { totp } from './totp';

const lastSteps = new Map<string, number>();

export async function totpForLogin(login: string, secret: string): Promise<string> {
  let step = Math.floor(Date.now() / 30_000);
  const previous = lastSteps.get(login);
  if (previous !== undefined && step <= previous) {
    await new Promise((resolve) =>
      setTimeout(resolve, (previous + 1) * 30_000 - Date.now() + 1_000),
    );
    step = Math.floor(Date.now() / 30_000);
  }

  lastSteps.set(login, step);
  return totp(secret, new Date(step * 30_000));
}

export function waitNextMfaStep(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 31_000));
}
