import { Component, OnInit, OnDestroy, AfterContentChecked, AfterViewInit } from '@angular/core';
import { HeaderService } from 'src/app/shared/services/header.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { QuoraService } from '../quora.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';
import { QuoraAccountsStats } from 'src/app/shared/models/quora-accounts-stats.model';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraQuestionCount } from 'src/app/shared/models/quora-question-count.model';
import { chartOptions, parseOptions } from "../../variables/charts";
import Chart from 'chart.js';


@Component({
  selector: 'app-quora-account',
  templateUrl: './quora-account.component.html',
  styleUrls: ['./quora-account.component.css']
})
export class QuoraAccountComponent implements OnInit, OnDestroy, AfterViewInit {

  subscription: Subscription = new Subscription();
  dateLabelArray: Date[] = [];
  weekLabels: string[] = [];
  monthLabels: string[] = [];
  account: QuoraAccount;

  topCards: any[] = [
    { title: 'Views', middleValue: '', bottomValue: '', bottomValueSuccess: false, icon: 'fas fa-eye', iconBgColor: 'bg-danger' },
    { title: 'Answers/Assign', middleValue: '', bottomValue: '', bottomValueSuccess: false, icon: 'fas fa-seedling', iconBgColor: 'bg-warning' },
    { title: 'Total Followers', middleValue: '', bottomValue: '', bottomValueSuccess: false, icon: 'fas fa-users', iconBgColor: 'bg-yellow' },
    { title: 'Upvotes', middleValue: '', bottomValue: '', bottomValueSuccess: false, icon: 'fas fa-thumbs-up', iconBgColor: 'bg-info' }
  ];

  charts: any[] = [
    { title: 'Views', name: 'views-chart', monthSelected: false },
    { title: 'Followers', name: 'followers-chart', monthSelected: false },
    { title: 'Requested Questions', name: 'requested-questions-chart', monthSelected: false }
  ];

  constructor(private _route: ActivatedRoute,
    private _headerService: HeaderService,
    private _quoraService: QuoraService) { }

  ngOnInit(): void {
    this.createChartLabels();
    parseOptions(Chart, chartOptions());
    this.subscription.add(
      this._route.paramMap.subscribe(params => {
        this._quoraService.getAccount(parseInt(params.get('id'))).subscribe((response: QuoraAccount) => {
          this.account = response;
          this._headerService.updateHeader(this.account.first_name + " " + this.account.last_name);
          this.loadData();
        })
      })
    );
  }

  ngAfterViewInit(): void {
    this.charts.forEach(chart => {
      var chartInView = document.getElementById(chart.name);
      chart.chart = new Chart(chartInView, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            labels: chart.title,
            data: []
          }]
        }
      });
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._headerService.releaseHeader();
  }

  createChartLabels(): void {
    this.dateLabelArray = [];
    this.weekLabels = [];
    this.monthLabels = [];
    for (let i = 1; i < 31; i++) {
      let dateVar = new Date();
      dateVar.setDate(dateVar.getDate() - i);
      this.dateLabelArray = [dateVar, ...this.dateLabelArray];
      this.monthLabels = [dateVar.getDate().toString(), ...this.monthLabels];
      if (i < 8) {
        this.weekLabels = [dateVar.toLocaleDateString('en-IN', { weekday: 'long' }), ...this.weekLabels];
      }
    }
  }

  loadData(): void {
    this.subscription.add(
      this._quoraService.getAccountStats(this.account.id).subscribe((rawQuoraAccountStats: QuoraAccountsStats[]) => {
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASKED, this.account.id).subscribe((rawAskedQuestionsCount: QuoraQuestionCount[]) => {
          this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.REQUESTED, this.account.id).subscribe((rawRequestedQuestionsCount: QuoraQuestionCount[]) => {
            this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ANSWERED, this.account.id).subscribe((rawAnsweredQuestionsCount: QuoraQuestionCount[]) => {
              this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASSIGNED, this.account.id).subscribe((rawAssignedQuestionsCount: QuoraQuestionCount[]) => {
                this.setQuoraAccountStatsDetails(rawQuoraAccountStats);
                let answersThisWeek = this.getTotalCount(rawAnsweredQuestionsCount, this.dateLabelArray[24], this.dateLabelArray[30]);
                this.topCards[1].middleValue = answersThisWeek + '/' + this.getTotalCount(rawAssignedQuestionsCount, this.dateLabelArray[24], this.dateLabelArray[30]);
                this.setBottomValues(answersThisWeek, this.getTotalCount(rawAnsweredQuestionsCount, this.dateLabelArray[17], this.dateLabelArray[23]), this.topCards[1]);
              })
            })
          })
        })
      })
    );
  }

  getTotalCount(questionCount: QuoraQuestionCount[], from: Date, to: Date): number {
    let total = 0;
    if (questionCount && questionCount.length > 0) {
      for (let i = 0; i < questionCount.length; i++) {
        if (new Date(questionCount[i].date) >= from && new Date(questionCount[i].date) <= to) {
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
    for (let i = 0; i < accountStats.length; i++) {
      if (new Date(accountStats[i].recorded_on) >= this.dateLabelArray[24] && new Date(accountStats[i].recorded_on) <= this.dateLabelArray[30]) {
        viewsThisWeek = viewsThisWeek + accountStats[i].view_count;
        upvotesThisWeek = upvotesThisWeek + accountStats[i].view_count;
        totalFollowsThisWeek = accountStats[i].total_followers > totalFollowsThisWeek? accountStats[i].total_followers: totalFollowsThisWeek;
      }
      else if (new Date(accountStats[i].recorded_on) >= this.dateLabelArray[17] && new Date(accountStats[i].recorded_on) <= this.dateLabelArray[23]) {
        viewsLastWeek = viewsLastWeek + accountStats[i].view_count;
        upvotesLastWeek = upvotesLastWeek + accountStats[i].view_count;
        totalFollowsLastWeek = accountStats[i].total_followers > totalFollowsLastWeek? accountStats[i].total_followers: totalFollowsLastWeek;
      }
      else if (new Date(accountStats[i].recorded_on) >= this.dateLabelArray[10] && new Date(accountStats[i].recorded_on) <= this.dateLabelArray[16]) {
        totalFollowsWeekBeforeLast = accountStats[i].total_followers > totalFollowsWeekBeforeLast? accountStats[i].total_followers : totalFollowsWeekBeforeLast;
      }
      if (i == accountStats.length - 1) {
        this.topCards[0].middleValue = viewsThisWeek;
        this.setBottomValues(viewsThisWeek, viewsLastWeek, this.topCards[0]);
        this.topCards[2].middleValue = totalFollowsThisWeek;
        this.setBottomValues(totalFollowsThisWeek-totalFollowsLastWeek, totalFollowsLastWeek-totalFollowsWeekBeforeLast, this.topCards[2]); 
        this.topCards[3].middleValue = upvotesThisWeek;
        this.setBottomValues(upvotesThisWeek, upvotesLastWeek, this.topCards[3]);
      }
    }
  }

  setBottomValues(thisWeek: number, lastWeek: number, topCard: any): void {
    if (lastWeek) {
      topCard.bottomValue = Math.round((Math.abs(thisWeek - lastWeek)*100)/lastWeek).toString() + '%';
      topCard.bottomValueSuccess = (thisWeek > lastWeek)? true: false;
    }
    else {
     topCard.bottomValue = (thisWeek > 0)? "All new": "No growth";
     topCard.bottomValueSuccess = (thisWeek > 0)? true: false;
    }
  }

}
