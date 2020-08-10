import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GmbCentreComponent } from './gmb-centre.component';

describe('GmbCentreComponent', () => {
  let component: GmbCentreComponent;
  let fixture: ComponentFixture<GmbCentreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GmbCentreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GmbCentreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
