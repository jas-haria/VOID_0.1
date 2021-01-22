import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuoraService } from '../quora.service';
import { DivisionService } from 'src/app/division/division.service';
import { Subscription, Subject, forkJoin } from 'rxjs';
import { Division } from 'src/app/shared/models/division.model';
import { TimePeriod } from 'src/app/shared/models/enums/time-period.enum';
import { QuoraQuestion } from 'src/app/shared/models/quora-question.model';
import { formatDate } from '@angular/common';
import { Page } from 'src/app/shared/models/page.model';
import { PageEvent } from '@angular/material/paginator';
import * as saveAS from 'file-saver';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraAskedQuestionStats } from 'src/app/shared/models/quora-asked-question-stats.model';
import { HeaderService } from 'src/app/shared/services/header/header.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';
import { HttpRequestInterceptorService } from 'src/app/shared/services/http-request-interceptor/http-request-interceptor.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { LoggedInUserService } from 'src/app/shared/services/logged-in-user/logged-in-user.service';

@Component({
  selector: 'app-quora-question-list',
  templateUrl: './quora-question-list.component.html',
  styleUrls: ['./quora-question-list.component.css']
})
export class QuoraQuestionListComponent implements OnInit, OnDestroy {


  displayedColumns: string[] = [];
  displayedColumnsWidth: any = {};
  displayedColumnsHeaders: string[] = [];
  isCheckbox: boolean = false;

  dataSource: any[] = [];
  totalLength: number = 0;
  pageSizeOptions: number[] = [10, 15, 20];
  clearSelect: Subject<void> = new Subject<void>();
  isLoggedInUserAdmin: boolean = false;

  subscription: Subscription = new Subscription();
  divisionArray: Division[] = [];
  accountArray: QuoraAccount[] = [];
  timePeriodEnumArray: TimePeriod[] = Object.values(TimePeriod);
  typeDisplayArray: QuoraQuestionAccountAction[] = [QuoraQuestionAccountAction.ASKED, QuoraQuestionAccountAction.REQUESTED, QuoraQuestionAccountAction.ASSIGNED,
  QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED];
  accountId: number = null;

  selectedType: QuoraQuestionAccountAction = QuoraQuestionAccountAction.NEW;
  selectedDivisions: number[] = [];
  selectedTimePeriod: TimePeriod = TimePeriod.WEEK;
  selectedPage: number = 1;
  selectedSize: number = this.pageSizeOptions[0];
  selectedQuestions: any[] = [];


  constructor(private _route: ActivatedRoute,
    private _router: Router,
    private _quoraService: QuoraService,
    private _divisionService: DivisionService,
    private _headerService: HeaderService,
    private _httpRequestInterceptorService: HttpRequestInterceptorService,
    private _modalService: NgbModal,
    private _loggedInUserService: LoggedInUserService) { }

  ngOnInit(): void {
    this._httpRequestInterceptorService.displaySpinner(true);
    this.subscription.add(
      forkJoin([
        this._divisionService.getAllDivision(), //0
        this._quoraService.getAccounts()        //1
      ]).subscribe((response: any[]) => {
        this.initialiseDivisions(response[0]);
        this.routeListner();
        this.accountArray = response[1];
        this.setHeaderValue();
        this._httpRequestInterceptorService.displaySpinner(false);
      })
    ).add(
      this._loggedInUserService.getUserAsObservable().subscribe(user => {
        this.isLoggedInUserAdmin = user ? user.admin: false;
      })
    );
  }

  routeListner(): void {
    this.subscription.add(
      this._route.paramMap.subscribe(params => {
        this.selectedType = this.getTypeFromParam(params.get('type'));
        this.setDisplayedColumnsInfo();
        this.accountId = params.get('accountId') ? parseInt(params.get('accountId')) : null;
        this.setHeaderValue();
        this._route.queryParams.subscribe(params => {
          if (null == params['page'] || null == params['size'] || null == params['divisions']
            || null == params['timePeriod']) {
            this.refreshPage(1);
          }
          else {
            this.selectedSize = this.pageSizeOptions.includes(Number(params['size'])) ? Number(params['size']) : this.pageSizeOptions[0];
            this.selectedPage = Number(params['page']) > 0 ? Number(params['page']) - 1 : 0; // -1 because first page on server is 0
            this.selectedDivisions = JSON.parse(params['divisions']);
            this.selectedTimePeriod = this.getTimePeriod(params['timePeriod']);
            this.refreshDataSource();
          }
        })
      })
    );
  }

  refreshDataSource(): void {
    this._httpRequestInterceptorService.displaySpinner(true);
    this.clearSelect.next();
    this.selectedQuestions = [];
    this.subscription.add(
      this._quoraService.getQuestions(this.selectedPage, this.selectedSize, this.selectedDivisions, this.selectedTimePeriod, this.selectedType, this.accountId).subscribe((response: Page<QuoraQuestion>) => {
        if (this.selectedType == QuoraQuestionAccountAction.ASKED) {
          this._quoraService.getAskedQuestionsStats(false, this.getIdsFromArray(response.content)).subscribe((stats: QuoraAskedQuestionStats[]) => {
            this.dataSource = response.content.map(question => this.mapQuestionForTable(question,
              stats.find((stat: QuoraAskedQuestionStats) => stat.question_id == question.id)
            ));
            this._httpRequestInterceptorService.displaySpinner(false);
          })
        }
        else {
          this.dataSource = response.content.map(question => this.mapQuestionForTable(question, null));
          this._httpRequestInterceptorService.displaySpinner(false);
        }
        this.totalLength = response.totalLength;
      })
    );
  }

  refreshPage(pageNumber?: number): void {
    let parameters = this.setUrlParameters(pageNumber ? pageNumber : 1, this.selectedSize, this.selectedDivisions, this.selectedTimePeriod);
    let url = this._router.url.substr(0, this._router.url.lastIndexOf('/'))
    if (this.accountId) {
      url = url.substr(0, url.lastIndexOf('/')) + '/' + this.selectedType.toLowerCase() + '/' + this.accountId;
    }
    else {
      url = url + "/" + this.selectedType.toLowerCase();
    }
    this._router.navigate([url], { queryParams: parameters });
  }

  setUrlParameters(page: number, size: number, divisionIds: number[], timePeriod: TimePeriod): any {
    return {
      'page': page,
      'size': size,
      'divisions': JSON.stringify(divisionIds),
      'timePeriod': timePeriod
    }
  }

  setHeaderValue(): void {
    if (this.accountId) {
      this.accountArray.forEach(account => {
        if (account.id == this.accountId) {
          this._headerService.updateHeader(account.first_name + " " + account.last_name);
        }
      });
    }
    else {
      this._headerService.updateHeader(this.selectedType + " Questions");
    }
  }

  setDisplayedColumnsInfo(): void {
    if (this.selectedType == QuoraQuestionAccountAction.ASKED) {
      this.isCheckbox = true;
      this.displayedColumns = ["id", "question_text", "views", "followers", "answers", "recorded_on"];
      this.displayedColumnsWidth = { "id": 10, "question_text": 45, "views": 10, "followers": 10, "answers": 10, "recorded_on": 15 }; //remaining 5 for checkbox
      this.displayedColumnsHeaders = ["Id", "Question", "Views", "Followers", "Answers", "Recorded On"];
    }
    else {
      this.isCheckbox = true;
      this.displayedColumns = ["id", "question_text", "division_name", "asked_on"];
      this.displayedColumnsWidth = { "id": 10, "question_text": 55, "division_name": 15, "asked_on": 15 }; //remaining 5 for checkbox
      this.displayedColumnsHeaders = ["Id", "Question", "Division", "Asked On"];
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._headerService.releaseHeader();
  }

  initialiseDivisions(divisions: Division[]): void {
    this.divisionArray = divisions;
    this.selectedDivisions = this.getIdsFromArray(divisions);
  }

  getIdsFromArray(arr: any[]): number[] {
    var result = [];
    arr.forEach(element => {
      result.push(element.id);
    })
    return result;
  }

  modifySelectedDivisions(division: Division): void {
    if (this.selectedDivisions.includes(division.id)) {
      if (this.selectedDivisions.length > 1) {
        this.selectedDivisions.splice(this.selectedDivisions.indexOf(division.id), 1);
      }
    }
    else {
      this.selectedDivisions.push(division.id);
      this.selectedDivisions.sort((a, b) => a - b);
    }
    this.refreshPage();
  }

  getTimePeriod(time: string): TimePeriod {
    switch (time) {
      case 'day': return TimePeriod.DAY
      case 'month': return TimePeriod.MONTH
      default: return TimePeriod.WEEK
    }
  }

  getTypeFromParam(type: string): QuoraQuestionAccountAction {
    switch (type) {
      case 'asked': return QuoraQuestionAccountAction.ASKED
      case 'answered': return QuoraQuestionAccountAction.ANSWERED
      case 'requested': return QuoraQuestionAccountAction.REQUESTED
      case 'evaluated': return QuoraQuestionAccountAction.EVALUATED
      case 'assigned': return QuoraQuestionAccountAction.ASSIGNED
      default: return QuoraQuestionAccountAction.NEW
    }
  }

  modifySelectedTimePeriod(timePeriod: TimePeriod): void {
    this.selectedTimePeriod = timePeriod;
    this.refreshPage();
  }

  mapQuestionForTable(question: QuoraQuestion, askedQuestionStats: QuoraAskedQuestionStats): any {
    if (this.selectedType == QuoraQuestionAccountAction.ASKED) {
      return {
        'id': question.id,
        'question_text': question.question_text,
        'question_url': question.question_url,
        'views': askedQuestionStats ? askedQuestionStats.view_count : null,
        'followers': askedQuestionStats ? askedQuestionStats.follower_count : null,
        'answers': askedQuestionStats ? askedQuestionStats.answer_count : null,
        'recorded_on': askedQuestionStats ? askedQuestionStats.recorded_on : null
      }
    }
    return {
      'id': question.id,
      'question_text': question.question_text,
      'question_url': question.question_url,
      'division_name': this.divisionArray.filter(division => division.id == question.division_id)[0].division,
      'asked_on': formatDate(question.asked_on, 'MMM dd, yyyy', 'en-US')
    }
  }

  pageUpdateEvent(pageEvent: PageEvent): void {
    this.selectedSize = pageEvent.pageSize;
    this.refreshPage(pageEvent.pageIndex + 1); //in other cases page number 1 will load
  }

  selectionEvent(selected: QuoraQuestion[]): void {
    this.selectedQuestions = selected;
  }

  downloadAssignedQuestions(accountId: number): void {
    let account = this.accountArray.find(account => accountId == account.id);
    let filename = "quora_" + account.first_name + "_" + account.last_name + "_" + formatDate(new Date(), 'dd-MMM-hh-mm-a', 'en-US');
    this.subscription.add(
      this._quoraService.downloadPendingQuestionsExcel(accountId).subscribe(data => {
        saveAS(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
      })
    );
  }

  disregardSelectedQuestions(): void {
    let modalRef = this.showConfirmationPopup()
    modalRef.result.then(result => {
      if (result == 'confirm') {
        this.subscription.add(
          this._quoraService.disregardQuestion(this.getIdsFromArray(this.selectedQuestions)).subscribe(response => {
            this.refreshDataSource(); //since url parameters haven't changed
          })
        );
      }
    });
  }

  updateQuestions(accountId: number, action: QuoraQuestionAccountAction): void {
    this.subscription.add(
      this._quoraService.updateQuestionAndAccountAction(this.getIdsFromArray(this.selectedQuestions), action, accountId).subscribe(response => {
        this.refreshDataSource();
      })
    );
  }

  modifySelectedType(type: QuoraQuestionAccountAction): void {
    this.selectedType = type;
    this.refreshPage();
  }

  revertActionOnSelectedQuestions(accountId: number, action: QuoraQuestionAccountAction): void {
    this.subscription.add(
      this._quoraService.deleteQuestionAndAccountAction(this.getIdsFromArray(this.selectedQuestions), action, accountId).subscribe(response => {
        this.refreshDataSource();
      })
    );
  }

  passQuestions(): void {
    let modalRef = this.showConfirmationPopup()
    modalRef.result.then(result => {
      if (result == 'confirm') {
        this.subscription.add(
          this._quoraService.passQuoraQuestions(this.getIdsFromArray(this.selectedQuestions), (this.accountId ? this.accountId : null)).subscribe((response) => {
            this.refreshDataSource();
          })
        );
      }
    });
  }

  showConfirmationPopup(): any {
    this._modalService.dismissAll();
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'danger';
    modalRef.componentInstance.title = 'Confirmation';
    modalRef.componentInstance.beforeBodyContentList = 'This action is irreversable. Are you sure you want to proceed?';
    modalRef.componentInstance.showConfirm = true;
    return modalRef;
  }

}
