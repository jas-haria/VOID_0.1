import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticatedLayoutModule } from './authenticated-layout.module';

describe('AuthenticatedLayoutModule', () => {
  let component: AuthenticatedLayoutModule;
  let fixture: ComponentFixture<AuthenticatedLayoutModule>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthenticatedLayoutModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthenticatedLayoutModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
