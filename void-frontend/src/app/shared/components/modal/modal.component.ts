import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {

  @Input('headerClass') headerClass: string = 'default';
  @Input('title') title: string = '';
  @Input('bodyContentBeforeList') bodyContentBeforeList: string = '';
  @Input('bodyContentList') bodyContentList: string[] = [];
  @Input('bodyContentAfterList') bodyContentAfterList: string[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
