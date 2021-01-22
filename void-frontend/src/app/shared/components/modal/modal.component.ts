import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {

  @Input('isSpinner') isLoading: boolean = false;
  @Input('showConfirm') showConfirm: boolean = false;
  @Input('headerClass') headerClass: string = 'default';
  @Input('title') title: string = '';
  @Input('beforeBodyContentList') beforeBodyContentList: string = '';
  @Input('bodyContentList') bodyContentList: string[] = [];
  @Input('afterBodyContentList') afterBodyContentList: string = '';

  constructor(private _ngbActiveModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  close(result: any): void {
    this._ngbActiveModal.close(result);
  }

}
