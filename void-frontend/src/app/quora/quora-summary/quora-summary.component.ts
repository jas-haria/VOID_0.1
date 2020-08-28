import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuoraService } from '../quora.service';
import { HeaderService } from 'src/app/shared/services/header.service';
import { QuoraAccountsStats } from 'src/app/shared/models/quora-accounts-stats.model';
import { Subscription } from 'rxjs';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraQuestionCount } from 'src/app/shared/models/quora-question-count.model';
import { QuoraAskedQuestionStats } from 'src/app/shared/models/quora-asked-question-stats.model';

@Component({
  selector: 'app-quora-summary',
  templateUrl: './quora-summary.component.html',
  styleUrls: ['./quora-summary.component.css']
})
export class QuoraSummaryComponent implements OnInit, OnDestroy {

  subscription: Subscription = new Subscription();
  monthLongValueArray: number[] = [];
  weekLabels: string[] = [];
  monthLabels: string[] = [];

  progressBars: any[] = [
    { title: 'Questions Answered', message: '', value: 0 },
    { title: 'Questions Asked', message: '', value: 0 }
  ];

  constructor(private _quoraService: QuoraService,
    private _headerService: HeaderService) { }

  ngOnInit(): void {
    this._headerService.updateHeader("Quora Summary");
    this.createChartLabels();
    this.loadData();
  }

  ngOnDestroy(): void {
    this._headerService.releaseHeader();
    this.subscription.unsubscribe();
  }

  createChartLabels(): void {
    this.monthLongValueArray = [];
    this.weekLabels = [];
    this.monthLabels = [];
    for (let i = 1; i < 31; i++) {
      let dateVar = new Date();
      dateVar.setDate(dateVar.getDate() - i);
      dateVar.setHours(0, 0, 0, 0);
      this.monthLongValueArray = [dateVar.getTime(), ...this.monthLongValueArray];
      this.monthLabels = [dateVar.getDate().toString(), ...this.monthLabels];
      if (i < 8) {
        this.weekLabels = [dateVar.toLocaleDateString('en-IN', { weekday: 'long' }), ...this.weekLabels];
      }
    }
  }

  loadData(): void {
    this.subscription.add(
      this._quoraService.getAccountStats().subscribe((rawAccountStats: QuoraAccountsStats[]) => {
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ANSWERED).subscribe((rawAnsweredQuestionsCount: QuoraQuestionCount[]) => {
          this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASKED).subscribe((rawAskedQuestionsCount: QuoraQuestionCount[]) => {
            this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.REQUESTED).subscribe((rawRequestedQuestionsCount: QuoraQuestionCount[]) => {
              this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASSIGNED).subscribe((rawAssignedQuestionsCount: QuoraQuestionCount[]) => {
                this._quoraService.getAskedQuestionsStats().subscribe((rawAskedQuestionsStats: QuoraAskedQuestionStats[]) => {
                  this.setProgressBarValues(rawAnsweredQuestionsCount, rawAssignedQuestionsCount, rawAskedQuestionsCount);
                })
              })
            })
          })
        })
      })
    );
  }

  getTotalCount(questionCount: QuoraQuestionCount[], from: number, to: number): number {
    let total = 0;
    if (questionCount && questionCount.length > 0) {
      for (let i = 0; i < questionCount.length; i++) {
        let questionCountDate = new Date(questionCount[i].date);
        questionCountDate.setHours(0, 0, 0, 0);
        let position = this.monthLongValueArray.indexOf(questionCountDate.getTime());
        if (position >= from && position <= to) {
          total = total + questionCount[i].count;
        }
        if (i == questionCount.length - 1) {
          return total;
        }
      }
    }
    else {
      return total;
    }
  }

  setProgressBarValues(answered: QuoraQuestionCount[], assigned: QuoraQuestionCount[], asked: QuoraQuestionCount[]): void {
    let answeredWeeklyCount = this.getTotalCount(answered, 23, 29),
      assignedWeeklyCount = this.getTotalCount(assigned, 23, 29),
      askedWeeklyCount = this.getTotalCount(asked, 23, 29);
    this.progressBars[0].value = (answeredWeeklyCount / assignedWeeklyCount) * 100;
    this.progressBars[0].message = answeredWeeklyCount + '/' + assignedWeeklyCount;
    this.progressBars[1].value = (askedWeeklyCount / 10) * 100;
    this.progressBars[1].message = askedWeeklyCount + '/10';
  }
}
