import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuoraService } from '../quora.service';
import { DivisionService } from 'src/app/division/division.service';
import { Subscription, Subject } from 'rxjs';
import { Division } from 'src/app/shared/models/division.model';
import { TimePeriod } from 'src/app/shared/models/enums/time-period.enum';
import { QuoraQuestion } from 'src/app/shared/models/quora-question.model';
import { formatDate } from '@angular/common';
import { Page } from 'src/app/shared/models/page.model';
import { PageEvent } from '@angular/material/paginator';
import * as saveAS from 'file-saver';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { QuoraAskedQuestionStats } from 'src/app/shared/models/quora-asked-question-stats.model';
import { HeaderService } from 'src/app/shared/services/header.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';

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
  clearSelect: Subject<void> = new Subject<void>()


  subscription: Subscription = new Subscription();
  divisionArray: Division[] = [];
  accountArray: QuoraAccount[] = [];
  timePeriodEnumArray: TimePeriod[] = Object.values(TimePeriod);

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
    private _headerService: HeaderService) { }

  ngOnInit(): void {
    this.subscription.add(
      this._divisionService.getAllDivision().subscribe((response: Division[]) => {
        this.initialiseDivisions(response);
        this.routeListner();
        this._quoraService.getAccounts().subscribe((response: QuoraAccount[]) => {
          this.accountArray = response;
        })
      })
    )
  }

  routeListner(): void {
    this.subscription.add(
      this._route.paramMap.subscribe(params => {
        this.selectedType = this.getTypeFromParam(params.get('type'));
        this.setDisplayedColumnsInfo();
        this._headerService.updateHeader(this.selectedType + " Questions");
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
    this.clearSelect.next();
    this.subscription.add(
      this._quoraService.getQuestions(this.selectedPage, this.selectedSize, this.selectedDivisions, this.selectedTimePeriod, this.selectedType, null).subscribe((response: Page<QuoraQuestion>) => {
        if (this.selectedType == QuoraQuestionAccountAction.ASKED) {
          this._quoraService.getAskedQuestionsStats(this.getIdsFromArray(response.content)).subscribe((stats: QuoraAskedQuestionStats[]) => {
            this.dataSource = response.content.map(question => this.mapQuestionForTable(question,
              stats.find((stat: QuoraAskedQuestionStats) => stat.question_id == question.id)
            ));
          })
        }
        else {
          this.dataSource = response.content.map((question: QuoraQuestion) => this.mapQuestionForTable(question, null));
        }
        this.totalLength = response.totalLength;
      })
    );
  }

  refreshPage(pageNumber?: number): void {
    let parameters = this.setUrlParameters(pageNumber ? pageNumber : 1, this.selectedSize, this.selectedDivisions, this.selectedTimePeriod);
    this._router.navigate([this._router.url.substr(0, this._router.url.lastIndexOf('/')) + "/" + this.selectedType.toLowerCase()], { queryParams: parameters });
  }

  setUrlParameters(page: number, size: number, divisionIds: number[], timePeriod: TimePeriod): any {
    return {
      'page': page,
      'size': size,
      'divisions': JSON.stringify(divisionIds),
      'timePeriod': timePeriod
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
      // case 'answered': return QuoraQuestionAccountAction.ANSWERED
      case 'requested': return QuoraQuestionAccountAction.REQUESTED
      // case 'evaluated': return QuoraQuestionAccountAction.EVALUATED
      default: return QuoraQuestionAccountAction.NEW
    }
  }

  modifySelectedTimePeriod(timePeriod: TimePeriod): void {
    this.selectedTimePeriod = timePeriod;
    this.refreshPage();
  }

  // toggleEvaluation(): void {
  //   this.selectedEvaluation = !this.selectedEvaluation;
  //   this.refreshPage();
  // }

  mapQuestionForTable(question: QuoraQuestion, askedQuestionStats: QuoraAskedQuestionStats): any {
    if (this.selectedType == QuoraQuestionAccountAction.ASKED) {
      return {
        'id': question.id,
        'question_text': question.question_text,
        'question_url': question.question_url,
        'views': askedQuestionStats.view_count,
        'followers': askedQuestionStats.follower_count,
        'answers': askedQuestionStats.answer_count,
        'recorded_on': askedQuestionStats.recorded_on
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

  // downloadQuestionsExcel(currentPage: boolean): void {
  //   let filename: string;
  //   if (currentPage) {
  //     filename = "quora_" + formatDate(new Date(), 'dd-MMM-hh-mm-a', 'en-US');
  //   }
  //   else {
  //     filename = "quora_past_" + this.selectedTimePeriod.toString() + "_all";
  //     this.divisionArray.forEach((division: Division) => {
  //       if (this.selectedDivisions.includes(division.id)) {
  //         filename = filename + "_" + division.division.toLowerCase();
  //       }
  //     });
  //   }
  //   this.subscription.add(
  //     this._quoraService.downloadExcel(currentPage, this.getIdsFromArray(this.dataSource), this.selectedDivisions, this.selectedTimePeriod).subscribe(data => {
  //       saveAS(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  //     })
  //   );
  // }

  disregardSelectedQuestions(): void {
    this._quoraService.disregardQuestion(this.getIdsFromArray(this.selectedQuestions)).subscribe(response => {
      this.refreshDataSource(); //since url parameters haven't changed
    });
  }

  assignQuestions(accountId: number): void {
    this._quoraService.updateQuestionAndAccountAction(this.getIdsFromArray(this.selectedQuestions), QuoraQuestionAccountAction.ASSIGNED, accountId).subscribe(response => {
      this.refreshDataSource();
    });
  }

}
