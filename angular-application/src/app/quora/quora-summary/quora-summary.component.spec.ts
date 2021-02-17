import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoraSummaryComponent } from './quora-summary.component';

describe('QuoraSummaryComponent', () => {
  let component: QuoraSummaryComponent;
  let fixture: ComponentFixture<QuoraSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuoraSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoraSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
