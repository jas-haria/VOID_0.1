import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {

  @Input('isSpinner') isLoading: boolean = false;
  @Input('showConfirm') showConfirm: boolean = true;
  @Input('headerClass') headerClass: string = 'default';
  @Input('title') title: string = '';
  @Input('bodyContentBeforeList') bodyContentBeforeList: string = '';
  @Input('bodyContentList') bodyContentList: string[] = [];
  @Input('bodyContentAfterList') bodyContentAfterList: string = '';

  constructor(private _ngbActiveModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  close(result: any): void {
    this._ngbActiveModal.close(result);
  }

}
