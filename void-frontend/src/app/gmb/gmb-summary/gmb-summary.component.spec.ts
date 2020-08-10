import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GmbSummaryComponent } from './gmb-summary.component';

describe('GmbSummaryComponent', () => {
  let component: GmbSummaryComponent;
  let fixture: ComponentFixture<GmbSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GmbSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GmbSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
