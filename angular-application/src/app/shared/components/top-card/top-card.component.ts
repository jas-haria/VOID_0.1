import { Component, OnInit, Input } from '@angular/core';
import { TopCardDetails } from '../../models/topcard-details.model';

@Component({
  selector: 'app-top-card',
  templateUrl: './top-card.component.html',
  styleUrls: ['./top-card.component.css']
})
export class TopCardComponent implements OnInit {

  @Input('topCard') topCard: TopCardDetails;

  constructor() { }

  ngOnInit(): void {
  }

}
