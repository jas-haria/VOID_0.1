import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderService } from '../../services/header/header.service';
import { Subscription } from 'rxjs';
import { LoggedInUserService } from '../../services/logged-in-user/logged-in-user.service';
import { User } from '../../models/user.model';
import * as Auth0 from 'auth0-web';


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

  logout(): void {
    Auth0.signOut({
      returnTo: 'http://localhost:4200/login',
      clientID: 'TecKzu7OhQKztXweiBO5Lv8pDSffkpfh'
    });
  }

}
