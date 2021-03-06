import { Component, OnInit, OnDestroy, NgModuleRef } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from './shared/components/modal/modal.component';
import { HttpRequestInterceptorService } from './shared/services/http-request-interceptor/http-request-interceptor.service';
import { Subscription } from 'rxjs';
import { AuthService } from './shared/services/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'argon-dashboard-angular';

  subscription: Subscription = new Subscription();

  constructor(private _modalService: NgbModal,
    private _httpRequestInterceptorService: HttpRequestInterceptorService,
    private _authService: AuthService) { }

  ngOnInit(): void {
    this._authService.localAuthSetup();
    this.subscription.add(
      this._httpRequestInterceptorService.getSpinnerDisplay().subscribe((show) => {
        if (show) {
          this.showSpinner();
        }
        else {
          this._modalService.dismissAll();
        }
      })
    ).add(
      this._httpRequestInterceptorService.getErrors().subscribe(error => {
        this._modalService.dismissAll();
        this.showErrorPopup(error);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._modalService.dismissAll();
  }

  showSpinner(): void {
    this._modalService.dismissAll();
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'default';
    modalRef.componentInstance.title = 'Loading...';
    modalRef.componentInstance.beforeBodyContentList = 'This may take a while. Please remember:';
    modalRef.componentInstance.bodyContentList = [
      'Rome was not built in a day',
      'Patience is bitter, but its fruit is sweet',
      'The wait is long and full of terrors'
    ];
    modalRef.componentInstance.afterBodyContentList = 'The popup mostly closed before you read this'
    modalRef.componentInstance.isLoading = true;
  }

  showErrorPopup(error: any): void {
    this._modalService.dismissAll();
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'danger';
    modalRef.componentInstance.title = 'Oops';
    modalRef.componentInstance.beforeBodyContentList = 'Something went wrong. The error is:';
    if (error && error['error'] && error['error'] instanceof Object) {
      let keys = Object.keys(error['error']);
      keys.forEach(key => {
        modalRef.componentInstance.bodyContentList = [
          ...modalRef.componentInstance.bodyContentList,
          key + ': ' + error['error'][key]
        ]
      })
    }
    else {
      modalRef.componentInstance.bodyContentList = [
        JSON.stringify(error)
      ];
    }
    modalRef.componentInstance.afterBodyContentList = 'Please grab a screenshot and share with Aum or Jas.';
  }
}
