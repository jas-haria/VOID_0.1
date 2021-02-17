import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoraQuestionListComponent } from './quora-question-list.component';

describe('QuoraQuestionListComponent', () => {
  let component: QuoraQuestionListComponent;
  let fixture: ComponentFixture<QuoraQuestionListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuoraQuestionListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoraQuestionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
