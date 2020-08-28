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

  progressBars: any[] = [
    { title: 'Questions Answered', message: '', value: 0},
    { title: 'Questions Asked', message: '', value: 0}
  ];

  constructor(private _quoraService: QuoraService,
    private _headerService: HeaderService) { }

  ngOnInit(): void {
    this._headerService.updateHeader("Quora Summary");
    this.loadData();
  }

  ngOnDestroy(): void {
    this._headerService.releaseHeader();
    this.subscription.unsubscribe();
  }

  loadData(): void {
    this.subscription.add(
      this._quoraService.getAccountStats().subscribe((rawAccountStats: QuoraAccountsStats[]) => {
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ANSWERED).subscribe((rawAnsweredQuestionsCount: QuoraQuestionCount[]) => {
          this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASKED).subscribe((rawAskedQuestionsCount: QuoraQuestionCount[]) => {
            this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.REQUESTED).subscribe((rawRequestedQuestionsCount: QuoraQuestionCount[]) => {
              this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASSIGNED).subscribe((rawAnsweredQuestionsCount: QuoraQuestionCount[]) => {
                this._quoraService.getAskedQuestionsStats().subscribe((rawAskedQuestionsStats: QuoraAskedQuestionStats[]) => {
                  
                })
              })
            })
          })
        })
      })
    );
  }

}
