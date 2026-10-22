import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ProblemStore } from './problem.store';

describe('ProblemStore', () => {
  it('memorise et efface la derniere erreur', () => {
    TestBed.configureTestingModule({ providers: [ProblemStore] });
    const store = TestBed.inject(ProblemStore);

    store.set({
      type: 'urn:pdref:error:X',
      title: 'X',
      status: 400,
      code: 'X',
      traceId: 't',
    });
    expect(store.lastProblem()?.code).toBe('X');

    store.clear();
    expect(store.lastProblem()).toBeNull();
  });
});
