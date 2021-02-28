import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoraArchievedComponent } from './quora-archieved.component';

describe('QuoraArchievedComponent', () => {
  let component: QuoraArchievedComponent;
  let fixture: ComponentFixture<QuoraArchievedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuoraArchievedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoraArchievedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
