import { Component, OnInit, OnDestroy, NgModuleRef } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from './shared/components/modal/modal.component';
import { HttpRequestInterceptorService } from './shared/services/http-request-interceptor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'argon-dashboard-angular';

  subscription: Subscription = new Subscription();

  constructor(private _modalService: NgbModal,
    private _httpRequestInterceptorService: HttpRequestInterceptorService) { }

  ngOnInit(): void {
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
        this.showErrorPopup();
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
    modalRef.componentInstance.bodyContentBeforeList = 'This may take a while. Please ensure:';
    modalRef.componentInstance.bodyContentList = [
      'Your machine is connected to the internet at all times',
      'Your machine does not sleep due to inactivity',
      'You do not close this window'
    ];
    modalRef.componentInstance.bodyContentAfterList = 'It will be worth the wait, really.'
    modalRef.componentInstance.isLoading = true;
  }

  showErrorPopup(): void {
    this._modalService.dismissAll();
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };
    let modalRef = this._modalService.open(ModalComponent, ngbModalOptions);
    modalRef.componentInstance.headerClass = 'danger';
    modalRef.componentInstance.title = 'Oops';
    modalRef.componentInstance.bodyContentBeforeList = 'Something went wrong. You can try the following:';
    modalRef.componentInstance.bodyContentList = [
      'Check your internet connection',
      'Check if both the servers are up',
      'Restart your browser and your servers',
      'Check if you provided the correct input'
    ];
    modalRef.componentInstance.bodyContentAfterList = 'If everything fails, kindly pray';
  }
}
