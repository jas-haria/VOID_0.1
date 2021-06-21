import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, NgModuleRef } from '@angular/core';
import { QuoraService } from '../quora.service';
import { HeaderService } from 'src/app/shared/services/header/header.service';
import { QuoraAccountsStats } from 'src/app/shared/models/quora-accounts-stats.model';
import { Subscription, Subject, forkJoin } from 'rxjs';
import * as saveAS from 'file-saver';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraQuestionCount } from 'src/app/shared/models/quora-question-count.model';
import { ChartDetails } from 'src/app/shared/models/chart-details.model';
import { TopCardDetails } from 'src/app/shared/models/topcard-details.model';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { HttpRequestInterceptorService } from 'src/app/shared/services/http-request-interceptor/http-request-interceptor.service';
import { ExecutionLog } from 'src/app/shared/models/execution-log.model';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { QuoraAskedQuestionArchieveStats } from 'src/app/shared/models/quora-asked-question-archieve-stats.model';

@Component({
  selector: 'app-quora-summary',
  templateUrl: './quora-summary.component.html',
  styleUrls: ['./quora-summary.component.css']
})
export class QuoraSummaryComponent implements OnInit, OnDestroy, AfterViewInit {

  subscription: Subscription = new Subscription();
  lastRefreshed: ExecutionLog = null;
  monthLongValueArray: number[] = [];
  weekLabels: string[] = [];
  monthLabels: string[] = [];
  isLoggedInUserAdmin: boolean = false;

  createOrRecreateChart: Subject<string> = new Subject<string>();
  updateChart: Subject<string> = new Subject<string>();

  fileToUpload: File = null;

  charts: ChartDetails[] = [new ChartDetails('Views', 'views-chart-summary', false),
  new ChartDetails('Requested vs Answered Questions', 'requested-answered-chart-summary', true)
  ];

  topCards: any[] = [
    new TopCardDetails('Views', 'fas fa-eye', 'bg-danger'),
    new TopCardDetails('Asked Questions Views', 'fas fa-chalkboard-teacher', 'bg-warning'),
    new TopCardDetails('Asked Questions Followers', 'fas fa-share-alt', 'bg-yellow'),
    new TopCardDetails('Asked Questions Answers', 'fas fa-thumbs-up', 'bg-info')
  ];

  progressBars: any[] = [
    { title: 'Questions Answered / Assigned', message: '', value: 0 },
    { title: 'Questions Asked', message: '', value: 0 }
  ];

  constructor(private _quoraService: QuoraService,
    private _headerService: HeaderService,
    private _modalService: NgbModal,
    private _httpRequestInterceptorService: HttpRequestInterceptorService,
    private _authService: AuthService) { }

  ngOnInit(): void {
    this.charts[1].multipleTitles = ['Answered', 'Requested'];
    this._headerService.updateHeader("Quora Summary");
    this.createChartLabels();
    this.loadData();
    this.subscription.add(
      this._authService.userProfile$.subscribe(user => {
        this.isLoggedInUserAdmin = user ? user.admin: false;
      })
    )
  }

  ngOnDestroy(): void {
    this._headerService.releaseHeader();
    this.subscription.unsubscribe();
    this._modalService.dismissAll();
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
    this._httpRequestInterceptorService.displaySpinner(true);
    this.subscription.add(
      forkJoin([
        this._quoraService.getLastRefreshed(),                                          //0
        this._quoraService.getAccountStats(),                                           //1
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ANSWERED),      //2
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASKED),         //3
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.REQUESTED),     //4
        this._quoraService.getQuestionsCount(QuoraQuestionAccountAction.ASSIGNED),      //5
        this._quoraService.getAskedQuestionsStats(true),                                //6
        this._quoraService.getAskedQuestionsStats(false)                                //7
      ]).subscribe((response: any[]) => {
        this.setAskedProgressBarValue(response[3]);
        this.setFromAnsweredAssignedRequestedCount(response[2], response[5], response[4]);
        this.setFromQuoraAccountStatsDetails(response[1]);
        this.setFromQuoraAskedQuestionStats(response[6], response[7]);
        this.lastRefreshed = response[0];
        this._httpRequestInterceptorService.displaySpinner(false);
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

  setAskedProgressBarValue(asked: QuoraQuestionCount[]): void {
    let askedWeeklyCount = this.getTotalCount(asked, 23, 29);
    this.progressBars[1].value = (askedWeeklyCount > 10) ? 100 : (askedWeeklyCount / 10) * 100;
    this.progressBars[1].message = askedWeeklyCount + '/10';
  }

  setFromAnsweredAssignedRequestedCount(answered: QuoraQuestionCount[], assigned: QuoraQuestionCount[], requestedCount: QuoraQuestionCount[]): void {
    let answeredWeeklyCount = 0, assignedWeeklyCount = this.getTotalCount(assigned, 23, 29);
    let answeredCountChart = this.getArrayOfZeros(30);
    for (let i = 0; i < answered.length; i++) {
      let countDate = new Date(answered[i].date);
      countDate.setHours(0, 0, 0, 0);
      let position = this.monthLongValueArray.indexOf(countDate.getTime());
      if (position != -1) {
        if (position >= 23 && position <= 29) {
          answeredWeeklyCount = answeredWeeklyCount + answered[i].count;
        }
        answeredCountChart[position] = answeredCountChart[position] + answered[i].count;
      }
      if (i == answered.length - 1) {
        this.progressBars[0].value = (answeredWeeklyCount > assignedWeeklyCount) ? 100 : (answeredWeeklyCount / assignedWeeklyCount) * 100;
        this.progressBars[0].message = answeredWeeklyCount + '/' + assignedWeeklyCount;
        this.charts[1].data[0] = answeredCountChart;
        this.setRequestedGraphValues(requestedCount);
      }
    }
  }

  setRequestedGraphValues(requestedCount: QuoraQuestionCount[]): void {
    let requestedCountChart = this.getArrayOfZeros(30);
    for (let i = 0; i < requestedCount.length; i++) {
      let countDate = new Date(requestedCount[i].date);
      countDate.setHours(0, 0, 0, 0);
      let position = this.monthLongValueArray.indexOf(countDate.getTime());
      if (position != -1) {
        requestedCountChart[position] = requestedCountChart[position] + requestedCount[i].count;
      }
      if (i == (requestedCount.length - 1)) {
        this.charts[1].data[1] = requestedCountChart;
        this.updateChart.next(this.charts[1].name);
      }
    }
  }

  setFromQuoraAccountStatsDetails(accountStats: QuoraAccountsStats[]): void {
    let viewsThisWeek = 0, viewsLastWeek = 0;
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
        }
        else if (position >= 16 && position <= 22) {
          viewsLastWeek = viewsLastWeek + accountStats[i].view_count;
        }
      }
      if (i == accountStats.length - 1) {
        this.charts[0].data = viewsChart;
        this.updateChart.next(this.charts[0].name);
        this.topCards[0].middleValue = viewsThisWeek;
        this.setBottomValues(viewsThisWeek, viewsLastWeek, this.topCards[0]);
      }
    }
  }

  setFromQuoraAskedQuestionStats(lastWeekAskedStats: QuoraAskedQuestionArchieveStats[], thisWeekAskedStats: QuoraAskedQuestionArchieveStats[]): void {
    let viewsThisWeek = 0, followersThisWeek = 0, answersThisWeek = 0, viewsLastWeek = 0, followersLastWeek = 0, answersLastWeek = 0;
    let combinedMaxLength = lastWeekAskedStats.length > thisWeekAskedStats.length ? lastWeekAskedStats.length : thisWeekAskedStats.length;
    for (let i = 0; i < combinedMaxLength; i++) {
      if (i < lastWeekAskedStats.length) {
        let statDate = new Date(lastWeekAskedStats[i].recorded_on);
        statDate.setHours(0, 0, 0, 0);
        let position = this.monthLongValueArray.indexOf(statDate.getTime());
        if (position >= 16 && position <= 22) {
          viewsLastWeek = viewsLastWeek + lastWeekAskedStats[i].view_count;
          followersLastWeek = followersLastWeek + lastWeekAskedStats[i].follower_count;
          answersLastWeek = answersLastWeek + lastWeekAskedStats[i].answer_count;
        }
      }
      if (i < thisWeekAskedStats.length) {
        let statDate = new Date(thisWeekAskedStats[i].recorded_on);
        statDate.setHours(0, 0, 0, 0);
        let position = this.monthLongValueArray.indexOf(statDate.getTime());
        if (position >= 23 && position <= 29) {
          viewsThisWeek = viewsThisWeek + thisWeekAskedStats[i].view_count;
          followersThisWeek = followersThisWeek + thisWeekAskedStats[i].follower_count;
          answersThisWeek = answersThisWeek + thisWeekAskedStats[i].answer_count;
        }
      }
      if (i == (combinedMaxLength - 1)) {
        this.topCards[1].middleValue = viewsThisWeek;
        this.setBottomValues(viewsThisWeek, viewsLastWeek, this.topCards[1]);
        this.topCards[2].middleValue = followersThisWeek;
        this.setBottomValues(followersThisWeek, followersLastWeek, this.topCards[2]);
        this.topCards[3].middleValue = answersThisWeek;
        this.setBottomValues(answersThisWeek, answersLastWeek, this.topCards[3]);
      }
    }
  }

  setBottomValues(thisWeek: number, lastWeek: number, topCard: TopCardDetails): void {
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

  downloadSampleForUpload(): void {
    this.subscription.add(
      this._quoraService.downloadTemplateExcel().subscribe(data => {
        saveAS(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), "quora_asked_questions_upload_template");
      })
    );
  }

  handleFileInput(files: FileList): void {
    this.fileToUpload = files.item(0);
    if (this.fileToUpload.name.substring(this.fileToUpload.name.lastIndexOf('.'), this.fileToUpload.name.length) != '.xlsx') {
      this.fileToUpload = null;
      this.showInvalidFilePopup('Invalid File Type', ['Only .xlsx extension allowed']);
    }
  }

  uploadQuoraAskedQuestionsFile(): void {
    let formData = new FormData();
    formData.append('file', this.fileToUpload);
    this._httpRequestInterceptorService.displaySpinner(true);
    this.subscription.add(
      this._quoraService.uploadQuoraAskedQuestionsFile(formData).subscribe((response: boolean) => {
        if (response) {
          this.fileToUpload = null;
          this._httpRequestInterceptorService.displaySpinner(false);
        }
        else {
          this.showInvalidFilePopup('Invalid File Contents', ['Headers need to be exactly like in the sample file',
            'No row can be partially filled', 'Cannot fill more than a 1000 rows at once', 'At least one row should be filled']);
        }
      })
    );
  }

  showInvalidFilePopup(title: string, bodyContentList: string[]): void {
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'danger';
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.beforeBodyContentList = 'Please recheck the file you have uploaded!'
    modalRef.componentInstance.bodyContentList = bodyContentList;
    modalRef.componentInstance.afterBodyContentList = 'Tip: Download the sample file again and fill it.'
  }

  refreshAllStats(): void {
    this._httpRequestInterceptorService.displaySpinner(true);
    this.subscription.add(
      this._quoraService.refreshAllStats().subscribe((response: ExecutionLog) => {
        this.lastRefreshed = response;
        this._httpRequestInterceptorService.displaySpinner(false);
      })
    );
  }

  refreshPopup(): void {
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'danger';
    modalRef.componentInstance.title = 'Refresh All Quora Statistics';
    modalRef.componentInstance.beforeBodyContentList = 'This will take a long time. Are you sure you want to run it now?'
    modalRef.componentInstance.afterBodyContentList = 'Tip: Run it when you are done using the application for the day'
    modalRef.componentInstance.showConfirm = true;
    modalRef.result.then(result => {
      if (result == 'confirm') {
        this.refreshAllStats()
      }
    });
  }

}
