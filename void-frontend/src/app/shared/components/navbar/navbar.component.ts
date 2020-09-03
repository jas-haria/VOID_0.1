import { Component, OnInit } from '@angular/core';
// import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  
  title: string = this._headerService.getHeaderValue();

  constructor(private _headerService: HeaderService) {
  }

  ngOnInit() {
    this._headerService.getHeaderObservable().subscribe((header: string) => {
      this.title = header;
    });
  }

}
