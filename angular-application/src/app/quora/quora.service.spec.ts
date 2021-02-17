import { TestBed } from '@angular/core/testing';

import { QuoraService } from './quora.service';

describe('QuoraService', () => {
  let service: QuoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
