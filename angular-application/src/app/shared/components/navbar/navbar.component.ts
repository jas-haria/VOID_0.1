import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderService } from '../../services/header/header.service';
import { Subscription } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth/auth.service';


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
    private _authService: AuthService) {
  }

  ngOnInit(): void {
    this.subscription.add(
      this._headerService.getHeaderObservable().subscribe((header: string) => {
        this.title = header;
      })
    ).add(
      this._authService.userProfile$.subscribe(user => {
        this.loggedInUser = user;
        console.log(user)
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout(): void {
    this._authService.logout();
  }

}
