import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
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

@Component({
  selector: 'app-quora-question-list',
  templateUrl: './quora-question-list.component.html',
  styleUrls: ['./quora-question-list.component.css']
})
export class QuoraQuestionListComponent implements OnInit, OnDestroy {

  displayedColumns = ["id", "question_text", "division_name", "asked_on" ];
  displayedColumnsWidth = {"id": 10, "question_text": 50, "division_name": 15, "asked_on": 15}; //remaining 5 for checkbox
  displayedColumnsHeaders = ["ID", "Question", "Division", "Asked On"];
  dataSource: any[] = [];
  totalLength: number = 0;
  pageSizeOptions: number[] = [10, 15, 20];
  clearSelect: Subject<void> = new Subject<void>()


  subscription: Subscription = new Subscription();
  divisionArray: Division[] = [];
  timePeriodEnumArray: TimePeriod[] = Object.values(TimePeriod);
  

  selectedDivisions: number[] = [];
  selectedTimePeriod: TimePeriod = TimePeriod.WEEK;
  selectedEvaluation: boolean = false;
  selectedPage: number = 1;
  selectedSize: number = this.pageSizeOptions[0];
  selectedQuestions: QuoraQuestion[] = [];


  constructor(private _route: ActivatedRoute,
    private _router: Router,
    private _quoraService: QuoraService,
    private _divisionService: DivisionService) { }

  ngOnInit(): void {
    this.subscription.add(
      this._divisionService.getAllDivision().subscribe((response: Division[]) => {
        this.initialiseDivisions(response);
        this.routeListner();
      })
    );
  }

  routeListner(): void {
    this.subscription.add(
      this._route.queryParams.subscribe(params => {
        if (null == params['page'] || null == params['size'] || null == params['divisions']
          || null == params['evaluated'] || null == params['timePeriod']) {
          this.refreshPage(1);
        }
        else {
          this.selectedSize = this.pageSizeOptions.includes(Number(params['size']))? Number(params['size']): this.pageSizeOptions[0];
          this.selectedPage = Number(params['page']) > 0? Number(params['page']) - 1: 0; // -1 because first page on server is 0
          this.selectedDivisions = JSON.parse(params['divisions']);
          this.selectedEvaluation = params['evaluated'] == 'false'? false: true;
          this.selectedTimePeriod = this.getTimePeriod(params['timePeriod']);
          this.refreshDataSource();
        }
      })
    );
  }

  refreshDataSource(): void {
    this.subscription.add(
      this._quoraService.getQuestions(this.selectedPage, this.selectedSize, this.selectedDivisions, this.selectedEvaluation, this.selectedTimePeriod).subscribe((response: Page<QuoraQuestion>) => {
        this.dataSource = response.content.map(question =>  this.mapQuestionForTable(question));
        this.totalLength = response.totalLength;
      })
    );
  }

  refreshPage(pageNumber?: number): void {
    this.clearSelect.next();
    let parameters = this.setUrlParameters(pageNumber? pageNumber: 1, this.selectedSize, this.selectedDivisions, this.selectedEvaluation, this.selectedTimePeriod);
    this._router.navigate([this._router.url.split('?')[0]], {queryParams: parameters});
  }

  setUrlParameters(page: number, size: number, divisionIds: number[], evaluated: boolean, timePeriod: TimePeriod): any {
    return {
      'page': page,
      'size': size,
      'divisions': JSON.stringify(divisionIds),
      'evaluated': evaluated,
      'timePeriod': timePeriod
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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

  modifySelectedTimePeriod(timePeriod: TimePeriod): void {
    this.selectedTimePeriod = timePeriod;
    this.refreshPage();
  }

  toggleEvaluation(): void {
    this.selectedEvaluation = !this.selectedEvaluation;
    this.refreshPage();
  }

  mapQuestionForTable(question: QuoraQuestion): any {
    return {
      'id': question.id,
      'question_text': question.question_text,
      'question_url': question.question_url,
      'division_name': this.divisionArray.filter(division => division.id == question.division_id)[0].division,
      'evaluated': question.evaluated,
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

  downloadQuestionsExcel(currentPage: boolean): void {
    let filename: string;
    if (currentPage) {
      filename = "quora_" + formatDate(new Date(), 'dd-MMM-hh-mm-a', 'en-US');
    }
    else {
      filename = "quora_past_" + this.selectedTimePeriod.toString() + "_all";
      this.divisionArray.forEach((division: Division) => {
        if (this.selectedDivisions.includes(division.id)) {
          filename = filename + "_" + division.division.toLowerCase();
        }
      });
    }
    this.subscription.add(
      this._quoraService.downloadExcel(currentPage, this.getIdsFromArray(this.dataSource), this.selectedDivisions, this.selectedTimePeriod).subscribe(data => {
        saveAS(new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), filename);
      })
    );
  }

}
