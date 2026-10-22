import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { isCorrelationId } from '../../utils/correlation';
import { CorrelationService } from './correlation.service';

describe('CorrelationService', () => {
  it('genere un identifiant valide et memorise le dernier', () => {
    TestBed.configureTestingModule({ providers: [CorrelationService] });
    const service = TestBed.inject(CorrelationService);
    const id = service.next();

    expect(isCorrelationId(id)).toBe(true);
    expect(service.last).toBe(id);
  });

  it('accepte un identifiant fourni', () => {
    TestBed.configureTestingModule({ providers: [CorrelationService] });
    const service = TestBed.inject(CorrelationService);
    service.set('corr-123');
    expect(service.last).toBe('corr-123');
  });
});
