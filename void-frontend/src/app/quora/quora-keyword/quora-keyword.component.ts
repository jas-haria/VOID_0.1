import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { DivisionService } from 'src/app/division/division.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { Division } from 'src/app/shared/models/division.model';
import { QuoraKeyword } from 'src/app/shared/models/quora-keyword';
import { User } from 'src/app/shared/models/user.model';
import { HeaderService } from 'src/app/shared/services/header/header.service';
import { LoggedInUserService } from 'src/app/shared/services/logged-in-user/logged-in-user.service';
import { QuoraService } from '../quora.service';

@Component({
  selector: 'app-quora-keyword',
  templateUrl: './quora-keyword.component.html',
  styleUrls: ['./quora-keyword.component.css']
})
export class QuoraKeywordComponent implements OnInit, OnDestroy {

  subscription: Subscription = new Subscription();
  divisions: Division[] = [];
  keywords: QuoraKeyword[] = [];
  divisionKeywordMap: Map<number, any> = new Map();
  isLoggedInUserAdmin: boolean = false;

  constructor(private _headerService: HeaderService,
    private _divisionService: DivisionService,
    private _quoraService: QuoraService,
    private _modalService: NgbModal,
    private _loggedInUserService: LoggedInUserService) { }

  ngOnInit(): void {
    this._headerService.updateHeader("Quora Keywords");
    this.divisionKeywordMap.clear();
    this.getData();
  }

  getData(): void {
    this.subscription.add(
      forkJoin([this._divisionService.getAllDivision(), this._quoraService.getKeywords()]).subscribe((response: any[]) => {
        this.divisions = response[0];
        this.keywords = response[1];
        this.populateMap();
      })
    ).add(
      this._loggedInUserService.getUserAsObservable().subscribe(user => {
        this.isLoggedInUserAdmin = user ? user.admin: false;
      })
    );
  }

  populateMap(): void {
    this.divisions.forEach(div => {
      this.divisionKeywordMap.set(div.id, {
        keywords: new Set(),
        expanded: this.divisionKeywordMap.has(div.id) ? this.divisionKeywordMap.get(div.id).expanded : false
      });
    });
    this.keywords.forEach(key => {
      this.divisionKeywordMap.get(key.division_id).keywords.add(key);
    });
  }

  deleteKeyword(keyword: QuoraKeyword): void {
    this.subscription.add(
      this._quoraService.deleteKeyword(keyword.keyword).subscribe(response => {
        this.getData();
      })
    );
  }

  addKeyword(keyword: string, division_id: number): void {
    let existingKeyword = this.keywords.find(key => key.keyword.toLowerCase() === keyword.toLowerCase());
    if (existingKeyword) {
      this.showDuplicateKeywordPopup(keyword, this.divisions.find(div => div.id === existingKeyword.division_id));
    }
    else {
      this.subscription.add(
        this._quoraService.addKeyWord(keyword, division_id).subscribe(response => {
          this.getData();
        })
      );
    }
  }

  showDuplicateKeywordPopup(keyword: string, division: Division): void {
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'danger';
    modalRef.componentInstance.title = 'Duplicate keyword!';
    modalRef.componentInstance.beforeBodyContentList = 'The keyword (' + keyword + ') exisits for a division (' + division.division + ')';
    modalRef.componentInstance.bodyContentList = [
      'The keyword will scrape questions for its associated division.',
      'Keywords are case insensitive.'
    ];
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._headerService.releaseHeader();
    this._modalService.dismissAll();
  }

}
