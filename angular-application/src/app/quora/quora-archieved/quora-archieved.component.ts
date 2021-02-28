import { Component, OnDestroy, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { HttpRequestInterceptorService } from 'src/app/shared/services/http-request-interceptor/http-request-interceptor.service';
import { QuoraService } from '../quora.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';
import { Page } from 'src/app/shared/models/page.model';
import { HeaderService } from 'src/app/shared/services/header/header.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';
import { QuoraArchievedQuestionResponse } from 'src/app/shared/models/quora_archieved_question_response.model';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';


@Component({
  selector: 'app-quora-archieved',
  templateUrl: './quora-archieved.component.html',
  styleUrls: ['./quora-archieved.component.css']
})
export class QuoraArchievedComponent implements OnInit, OnDestroy {

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  keywords: string[] = []
  disableRefreshButton: boolean = false;

  displayedColumns: string[] = [];
  displayedColumnsWidth: any = {};
  displayedColumnsHeaders: string[] = [];
  dataSource: any[] = [];
  totalLength: number = 0;
  pageSizeOptions: number[] = [10, 15, 20];

  selectedPage: number = 1;
  selectedSize: number = this.pageSizeOptions[0];
  selectedType: QuoraQuestionAccountAction;
  accountId: number = null;
  typeDisplayArray: QuoraQuestionAccountAction[] = [QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.ASKED];


  accounts: QuoraAccount[] = []

  subscription: Subscription = new Subscription();

  constructor(private _httpRequestInterceptorService: HttpRequestInterceptorService,
    private _quoraService: QuoraService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _headerService: HeaderService,
    private _modalService: NgbModal) { }

  ngOnInit(): void {
    this.subscription.add(
      this._quoraService.getAccounts().subscribe(response => {
        this.accounts = response;
        this.routeListner();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  addKeyword(event: MatChipInputEvent, index?: number): void {
    const input = event.input;
    const value = event.value;
    // Add our keyword
    if ((value || '').trim()) {
      let newKeyword = value.trim();
      if (!this.keywords.includes(newKeyword)) {
        this.keywords.push(newKeyword)
        this.disableRefreshButton = false;
      }
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  removeKeyword(keyword: string): void {
    const index = this.keywords.indexOf(keyword);
    if (index >= 0) {
      this.keywords.splice(index, 1);
      this.disableRefreshButton = false;
    }
  }

  moveKeyword(keyword: string, left: boolean): void {
    let currentIndex = this.keywords.indexOf(keyword);
    if (left && currentIndex > 0) {
      this.removeKeyword(keyword);
      this.keywords.splice(currentIndex - 1, 0, keyword);
    }
    else if (!left && currentIndex < (this.keywords.length - 1)) {
      this.removeKeyword(keyword);
      this.keywords.splice(currentIndex + 1, 0, keyword);
    }
  }

  refreshKeywords(): void {
    this.refreshPage(1);
  }

  pageUpdateEvent(pageEvent: PageEvent): void {
    this.selectedSize = pageEvent.pageSize;
    this.refreshPage(pageEvent.pageIndex + 1); //in other cases page number 1 will load
  }

  refreshDataSource(): void {
    this._httpRequestInterceptorService.displaySpinner(true);
    this.subscription.add(
        this._quoraService.getArchievedQuestions(this.selectedPage, this.selectedSize, this.selectedType, this.accountId, this.keywords).subscribe((response: Page<QuoraArchievedQuestionResponse>) => {
          if (this.selectedType == QuoraQuestionAccountAction.ANSWERED) {
            this.dataSource = response.content.map(question => this.mapQuestionForTable(question));
          }
          else if (this.selectedType == QuoraQuestionAccountAction.ASKED) {
            this.dataSource = [];
          }
          this.totalLength = response.totalLength;
          this.disableRefreshButton = true;
          this._httpRequestInterceptorService.displaySpinner(false);
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
          if (null == params['page'] || null == params['size'] || null == ['keywords']) {
            this.refreshPage(1);
          }
          else {
            this.selectedSize = this.pageSizeOptions.includes(Number(params['size'])) ? Number(params['size']) : this.pageSizeOptions[0];
            this.selectedPage = Number(params['page']) > 0 ? Number(params['page']) - 1 : 0; // -1 because first page on server is 0
            this.keywords = JSON.parse(params['keywords']);
            this.refreshDataSource();
          }
        })
      })
    );
  }

  getTypeFromParam(type: string): QuoraQuestionAccountAction {
    switch (type) {
      case 'asked': return QuoraQuestionAccountAction.ASKED
      case 'answered':
      default: return QuoraQuestionAccountAction.ANSWERED
    }
  }

  setDisplayedColumnsInfo(): void {
    if (this.selectedType == QuoraQuestionAccountAction.ANSWERED) {
      this.displayedColumns = ["id", "question_text", "answered_by"];
      this.displayedColumnsWidth = { "id": 10, "question_text": 70, "answered_by": 20 };
      this.displayedColumnsHeaders = ["Id", "Question", "Answerd By"]
    }
  }

  setHeaderValue(): void {
    let header = this.selectedType + " Questions Archieve";
    if (this.accountId) {
      let account = this.accounts.find(account => account.id == this.accountId);
      header = account.first_name + " " + account.last_name;
    }
    this._headerService.updateHeader(header);
  }

  refreshPage(pageNumber?: number): void {
    let parameters = this.setUrlParameters(pageNumber ? pageNumber : 1, this.selectedSize, this.keywords);
    let url = this._router.url.substr(0, this._router.url.lastIndexOf('/'))
    if (this.accountId) {
      url = url.substr(0, url.lastIndexOf('/')) + '/' + this.selectedType.toLowerCase() + '/' + this.accountId;
    }
    else {
      url = url + '/' + this.selectedType.toLowerCase();
    }
    this._router.navigate([url], { queryParams: parameters });
  }

  setUrlParameters(page: number, size: number, keywords: string[]): any {
    return {
      'page': page,
      'size': size,
      'keywords': JSON.stringify(this.keywords)
    }
  }

  mapQuestionForTable(question: QuoraArchievedQuestionResponse): any {
    let answered_by = []
    question.account_ids.forEach(id => {
      let account = this.accounts.find(x => x.id === id);
      if (account) {
        let account_object = {}
        account_object['id'] = account.id;
        account_object['name'] = account.first_name + " " + account.last_name;
        account_object['answer'] = question.question_url + "/answer" + account.link.substr(account.link.lastIndexOf('/'), account.link.length);
        answered_by = [...answered_by, account_object]
      }
    });
    return {
      "id": question.id,
      "question_text": question.question_text,
      "question_url": question.question_url,
      "answered_by": answered_by
    }
  }

  actionEvent(event: any) {
    if (event) {
      if (event.action == 'delete') {
        let modalRef = this.showConfirmationPopup()
        modalRef.result.then(result => {
          if (result == 'confirm') {
            this._httpRequestInterceptorService.displaySpinner(true);
            this.subscription.add(
              this._quoraService.deleteArchievedQuestionAndAccountAction(event.data.question_id, event.data.account_id,
                QuoraQuestionAccountAction[event.data.action]).subscribe(response => {
                  this.refreshDataSource();
                })
            );
          }
        })
      }
    }
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

  modifySelectedType(type: QuoraQuestionAccountAction): void {
    this.selectedType = type;
    this.refreshPage();
  }

}
