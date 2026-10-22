import type { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

const testProviders: (Provider | EnvironmentProviders)[] = [
  provideRouter([{ path: '**', children: [] }]),
  provideHttpClient(),
  provideHttpClientTesting(),
];

export default testProviders;
