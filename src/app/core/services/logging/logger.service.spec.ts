import { describe, expect, it, vi } from 'vitest';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  it('masque les cles sensibles', () => {
    const logger = new LoggerService();
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    logger.debug('test', { email: 'secret@example.ci', ncc: '123', safe: 'ok' });

    expect(debug).toHaveBeenCalled();
    const payload = debug.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload['email']).toBe('[redacted]');
    expect(payload['ncc']).toBe('[redacted]');
    expect(payload['safe']).toBe('ok');
    debug.mockRestore();
  });

  it('ne journalise que le type d erreur', () => {
    const logger = new LoggerService();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('echec', new TypeError('secret'), { token: 'abc' });

    const payload = error.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload['token']).toBe('[redacted]');
    expect(payload['errorType']).toBe('TypeError');
    expect(JSON.stringify(payload)).not.toContain('secret');
    error.mockRestore();
  });

  it('expose info et warn', () => {
    const logger = new LoggerService();
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logger.info('i');
    logger.warn('w');
    expect(info).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    info.mockRestore();
    warn.mockRestore();
  });
});
