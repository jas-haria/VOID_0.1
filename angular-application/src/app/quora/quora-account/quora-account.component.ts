import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HeaderService } from 'src/app/shared/services/header/header.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { QuoraService } from '../quora.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';
import { QuoraAccountsStats } from 'src/app/shared/models/quora-accounts-stats.model';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraQuestionCount } from 'src/app/shared/models/quora-question-count.model';
import { ChartDetails } from 'src/app/shared/models/chart-details.model';
import { TopCardDetails } from 'src/app/shared/models/topcard-details.model';
import { HttpRequestInterceptorService } from 'src/app/shared/services/http-request-interceptor/http-request-interceptor.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';


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
  isLoggedInUserAdmin: boolean = false;

  createOrRecreateChart: Subject<string> = new Subject<string>();
  updateChart: Subject<string> = new Subject<string>();

  charts: ChartDetails[] = [new ChartDetails('Views', 'views-chart', false),
  new ChartDetails('Requested vs Answered Questions', 'requested-answered-chart', true)];

  topCards: any[] = [
    new TopCardDetails('Views', 'fas fa-eye', 'bg-danger'),
    new TopCardDetails('Answers/Assign', 'fas fa-seedling', 'bg-warning'),
    new TopCardDetails('Followers', 'fas fa-users', 'bg-yellow'),
    new TopCardDetails('Upvotes', 'fas fa-thumbs-up', 'bg-info')
  ];
  followerTopCard: TopCardDetails = new TopCardDetails('Total Followers', 'fas fa-user-secret', 'bg-dark')

  constructor(private _route: ActivatedRoute,
    private _headerService: HeaderService,
    private _quoraService: QuoraService,
    private _httpRequestInterceptorService: HttpRequestInterceptorService,
    private _authService: AuthService) { }

  ngOnInit(): void {
    this.createChartLabels();
    this.charts[1].multipleTitles = ['Answered', 'Requested'];
    this.subscription.add(
      this._route.paramMap.subscribe(params => {
        this._httpRequestInterceptorService.displaySpinner(true);
        this.refreshAllDisplayData();
        this._quoraService.getAccount(parseInt(params.get('id'))).subscribe((response: QuoraAccount) => {
          this.account = response;
          this._headerService.updateHeader(this.account.first_name + " " + this.account.last_name);
          this.loadData();
        })
      })
    ).add(
      this._authService.userProfile$.subscribe(user => {
        this.isLoggedInUserAdmin = user ? user.admin : false;
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
      if (chart.multipleDatasets) {
        chart.multipleTitles.forEach(title => {
          chart.data = [...chart.data, []];
        })
      }
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
      this._quoraService.getAccountStats(this.account.id).subscribe(response0 => {
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.REQUESTED, this.account.id).subscribe(response1 => {
          this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ANSWERED, this.account.id).subscribe(response2 => {
            this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASSIGNED, this.account.id).subscribe(response3 => {
              this.setQuoraAccountStatsDetails(response0);
              this.setAnsweredRequestedGraph(response2, response1);
              this.setAnswersTopCard(response2, response3);
              this._httpRequestInterceptorService.displaySpinner(false);
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

  setAnsweredRequestedGraph(answered: QuoraQuestionCount[], requestedCount: QuoraQuestionCount[]): void {
    let answeredCountChart = this.getArrayOfZeros(30);
    for (let i = 0; i < answered.length; i++) {
      let countDate = new Date(answered[i].date);
      countDate.setHours(0, 0, 0, 0);
      let position = this.monthLongValueArray.indexOf(countDate.getTime());
      if (position != -1) {
        answeredCountChart[position] = answeredCountChart[position] + answered[i].count;
      }
      if (i == answered.length - 1) {
        this.charts[1].data[0] = answeredCountChart;
        this.setRequestedGraphValues(requestedCount);
      }
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
      if (position != -1) {
        viewsChart[position] = viewsChart[position] + accountStats[i].view_count;
        if (position >= 23 && position <= 29) {
          viewsThisWeek = viewsThisWeek + accountStats[i].view_count;
          upvotesThisWeek = upvotesThisWeek + accountStats[i].upvote_count;
          totalFollowsThisWeek = accountStats[i].total_followers > totalFollowsThisWeek ? accountStats[i].total_followers : totalFollowsThisWeek;
        }
        else if (position >= 16 && position <= 22) {
          viewsLastWeek = viewsLastWeek + accountStats[i].view_count;
          upvotesLastWeek = upvotesLastWeek + accountStats[i].upvote_count;
          totalFollowsLastWeek = accountStats[i].total_followers > totalFollowsLastWeek ? accountStats[i].total_followers : totalFollowsLastWeek;
        }
        else if (position >= 9 && position <= 15) {
          totalFollowsWeekBeforeLast = accountStats[i].total_followers > totalFollowsWeekBeforeLast ? accountStats[i].total_followers : totalFollowsWeekBeforeLast;
        }
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
        this.followerTopCard.middleValue = (totalFollowsThisWeek != 0 ? totalFollowsThisWeek : (totalFollowsLastWeek != 0 ? totalFollowsLastWeek : totalFollowsWeekBeforeLast)).toString();
      }
    }
  }

  setRequestedGraphValues(rawRequestedQuestionsCount: QuoraQuestionCount[]): void {
    let requestsChart = this.getArrayOfZeros(30);
    for (let i = 0; i < rawRequestedQuestionsCount.length; i++) {
      let questionCountDate = new Date(rawRequestedQuestionsCount[i].date);
      questionCountDate.setHours(0, 0, 0, 0);
      let position = this.monthLongValueArray.indexOf(questionCountDate.getTime());
      if (position != -1) {
        requestsChart[position] = requestsChart[position] + rawRequestedQuestionsCount[i].count;
      }
      if (i == (rawRequestedQuestionsCount.length - 1)) {
        this.charts[1].data[1] = requestsChart;
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
