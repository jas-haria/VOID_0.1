import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoraAccountComponent } from './quora-account.component';

describe('QuoraAccountComponent', () => {
  let component: QuoraAccountComponent;
  let fixture: ComponentFixture<QuoraAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuoraAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoraAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
