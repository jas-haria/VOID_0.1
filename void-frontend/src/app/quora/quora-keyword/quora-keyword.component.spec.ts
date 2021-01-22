import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoraKeywordComponent } from './quora-keyword.component';

describe('QuoraKeywordComponent', () => {
  let component: QuoraKeywordComponent;
  let fixture: ComponentFixture<QuoraKeywordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuoraKeywordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoraKeywordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
