import { TestBed } from '@angular/core/testing';

import { SimpsonsApi } from './simpsons-api';

describe('SimpsonsApi', () => {
  let service: SimpsonsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimpsonsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
