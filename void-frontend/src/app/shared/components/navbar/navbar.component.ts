import { Component, OnInit } from '@angular/core';
// import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { HeaderService } from '../../services/header.service';
import { OktaAuthService } from '@okta/okta-angular';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  
  title: string = this._headerService.getHeaderValue();

  constructor(private _headerService: HeaderService,
    private _oktaAuth: OktaAuthService) {
  }

  ngOnInit() {
    this._headerService.getHeaderObservable().subscribe((header: string) => {
      this.title = header;
    });
  }

  async logout() {
    await this._oktaAuth.logout('/');
  }

}
