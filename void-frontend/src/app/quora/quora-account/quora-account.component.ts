import { Component, OnInit, OnDestroy, AfterContentChecked, AfterViewInit } from '@angular/core';
import { HeaderService } from 'src/app/shared/services/header.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { QuoraService } from '../quora.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';
import { QuoraAccountsStats } from 'src/app/shared/models/quora-accounts-stats.model';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraQuestionCount } from 'src/app/shared/models/quora-question-count.model';
import { ChartDetails } from 'src/app/shared/models/chart-details.model';
import { TopCardDetails } from 'src/app/shared/models/topcard-details.model';


@Component({
  selector: 'app-quora-account',
  templateUrl: './quora-account.component.html',
  styleUrls: ['./quora-account.component.css']
})
export class QuoraAccountComponent implements OnInit, OnDestroy, AfterViewInit {

  subscription: Subscription = new Subscription();
  monthLongValueArray: number[] = [];
  weekLabels: string[] = [];
  monthLabels: string[] = [];
  account: QuoraAccount;

  createOrRecreateChart: Subject<string> = new Subject<string>();
  updateChart: Subject<string> = new Subject<string>();

  charts: ChartDetails[] = [new ChartDetails('Views', 'views-chart', false),
  new ChartDetails('Requested Questions', 'requested-questions-chart', false)];

  topCards: any[] = [
    new TopCardDetails('Views', 'fas fa-eye', 'bg-danger'),
    new TopCardDetails('Answers/Assign', 'fas fa-seedling', 'bg-warning'),
    new TopCardDetails('Followers', 'fas fa-users', 'bg-yellow'),
    new TopCardDetails('Upvotes', 'fas fa-thumbs-up', 'bg-info')
  ];

  constructor(private _route: ActivatedRoute,
    private _headerService: HeaderService,
    private _quoraService: QuoraService) { }

  ngOnInit(): void {
    this.createChartLabels();
    this.subscription.add(
      this._route.paramMap.subscribe(params => {
        this.refreshAllDisplayData();
        this._quoraService.getAccount(parseInt(params.get('id'))).subscribe((response: QuoraAccount) => {
          this.account = response;
          this._headerService.updateHeader(this.account.first_name + " " + this.account.last_name);
          this.loadData();
        })
      })
    );
  }

  ngAfterViewInit(): void {
    this.refreshAllDisplayData();
  }

  refreshAllDisplayData(): void {
    this.charts.forEach(chart => {
      chart.monthSelected = false;
      chart.barSelected = false;
      chart.data = [];
      this.createOrRecreateChart.next(chart.name);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._headerService.releaseHeader();
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
      this._quoraService.getAccountStats(this.account.id).subscribe((rawQuoraAccountStats: QuoraAccountsStats[]) => {
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.REQUESTED, this.account.id).subscribe((rawRequestedQuestionsCount: QuoraQuestionCount[]) => {
          this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ANSWERED, this.account.id).subscribe((rawAnsweredQuestionsCount: QuoraQuestionCount[]) => {
            this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASSIGNED, this.account.id).subscribe((rawAssignedQuestionsCount: QuoraQuestionCount[]) => {
              this.setQuoraAccountStatsDetails(rawQuoraAccountStats);
              this.setRequestedChart(rawRequestedQuestionsCount);
              this.setAnswersTopCard(rawAnsweredQuestionsCount, rawAssignedQuestionsCount);
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

  setQuoraAccountStatsDetails(accountStats: QuoraAccountsStats[]): void {
    let viewsThisWeek = 0, totalFollowsThisWeek = 0, upvotesThisWeek = 0, viewsLastWeek = 0, totalFollowsLastWeek = 0, upvotesLastWeek = 0, totalFollowsWeekBeforeLast = 0;
    let viewsChart = this.getArrayOfZeros(30);
    for (let i = 0; i < accountStats.length; i++) {
      let statDate = new Date(accountStats[i].recorded_on);
      statDate.setHours(0, 0, 0, 0);
      let statDateTime = statDate.getTime();
      let position = this.monthLongValueArray.indexOf(statDateTime);
      viewsChart[position] = viewsChart[position] + accountStats[i].view_count;
      if (position >= 23 && position <= 29) {
        viewsThisWeek = viewsThisWeek + accountStats[i].view_count;
        upvotesThisWeek = upvotesThisWeek + accountStats[i].view_count;
        totalFollowsThisWeek = accountStats[i].total_followers > totalFollowsThisWeek ? accountStats[i].total_followers : totalFollowsThisWeek;
      }
      else if (position >= 16 && position <= 22) {
        viewsLastWeek = viewsLastWeek + accountStats[i].view_count;
        upvotesLastWeek = upvotesLastWeek + accountStats[i].view_count;
        totalFollowsLastWeek = accountStats[i].total_followers > totalFollowsLastWeek ? accountStats[i].total_followers : totalFollowsLastWeek;
      }
      else if (position >= 9 && position <= 15) {
        totalFollowsWeekBeforeLast = accountStats[i].total_followers > totalFollowsWeekBeforeLast ? accountStats[i].total_followers : totalFollowsWeekBeforeLast;
      }
      if (i == accountStats.length - 1) {
        this.charts[0].data = viewsChart;
        this.updateChart.next(this.charts[0].name);
        this.topCards[0].middleValue = viewsThisWeek;
        this.setBottomValues(viewsThisWeek, viewsLastWeek, this.topCards[0]);
        this.topCards[2].middleValue = totalFollowsThisWeek - totalFollowsLastWeek;
        this.setBottomValues(totalFollowsThisWeek - totalFollowsLastWeek, totalFollowsLastWeek - totalFollowsWeekBeforeLast, this.topCards[2]);
        this.topCards[3].middleValue = upvotesThisWeek;
        this.setBottomValues(upvotesThisWeek, upvotesLastWeek, this.topCards[3]);
      }
    }
  }

  setRequestedChart(rawRequestedQuestionsCount: QuoraQuestionCount[]): void {
    let requestsChart = this.getArrayOfZeros(30);
    for (let i = 0; i < rawRequestedQuestionsCount.length; i++) {
      let questionCountDate = new Date(rawRequestedQuestionsCount[i].date);
      questionCountDate.setHours(0, 0, 0, 0);
      let position = this.monthLongValueArray.indexOf(questionCountDate.getTime());
      if (position != -1) {
        requestsChart[position] = requestsChart[position] + rawRequestedQuestionsCount[i].count;
      }
      if (i == (rawRequestedQuestionsCount.length - 1)) {
        this.charts[1].data = requestsChart;
        this.updateChart.next(this.charts[1].name);
      }
    }
  }

  setAnswersTopCard(rawAnsweredQuestionsCount: QuoraQuestionCount[], rawAssignedQuestionsCount: QuoraQuestionCount[]): void {
    let answersThisWeek = this.getTotalCount(rawAnsweredQuestionsCount, 23, 29);
    this.topCards[1].middleValue = answersThisWeek + '/' + this.getTotalCount(rawAssignedQuestionsCount, 23, 29);
    this.setBottomValues(answersThisWeek, this.getTotalCount(rawAnsweredQuestionsCount, 16, 22), this.topCards[1]);
  }

  setBottomValues(thisWeek: number, lastWeek: number, topCard: any): void {
    if (lastWeek) {
      topCard.bottomValue = Math.round((Math.abs(thisWeek - lastWeek) * 100) / lastWeek).toString() + '%';
      topCard.bottomValueSuccess = (thisWeek > lastWeek) ? true : false;
    }
    else {
      topCard.bottomValue = (thisWeek > 0) ? "All new" : "No growth";
      topCard.bottomValueSuccess = (thisWeek > 0) ? true : false;
    }
    topCard.bottomMessage = "since last week";
  }

  getArrayOfZeros(length: number): number[] {
    let array = new Array();
    for (let i = 0; i < length; i++) {
      array.push(0);
    }
    return array;
  }

}
