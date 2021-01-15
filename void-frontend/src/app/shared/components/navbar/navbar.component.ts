import { Component, OnDestroy, OnInit } from '@angular/core';
// import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { HeaderService } from '../../services/header/header.service';
import { OktaAuthService } from '@okta/okta-angular';
import { Subscription } from 'rxjs';
import { LoggedInUserService } from '../../services/logged-in-user/logged-in-user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  title: string = this._headerService.getHeaderValue();
  subscription: Subscription = new Subscription();
  loggedInUser: User = null;

  constructor(private _headerService: HeaderService,
    private _oktaAuth: OktaAuthService,
    private _loggedInUserService: LoggedInUserService) {
  }

  ngOnInit(): void {
    this.subscription.add(
      this._headerService.getHeaderObservable().subscribe((header: string) => {
        this.title = header;
      })
    ).add(
      this._loggedInUserService.getUserAsObservable().subscribe(user => {
        console.log(user)
        this.loggedInUser = user;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async logout() {
    await this._oktaAuth.logout('/');
  }

}
