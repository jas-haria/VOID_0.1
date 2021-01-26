import { Component, OnInit } from '@angular/core';
import * as Auth0 from 'auth0-web';
import { Router } from '@angular/router';
import { LoggedInUserService } from 'src/app/shared/services/logged-in-user/logged-in-user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  currentDate: Date = new Date();

  constructor(private _router: Router,
     private _loggedInUserService: LoggedInUserService) {}

  ngOnInit() {
    this._loggedInUserService.updateUser(null);
    console.log(Auth0.isAuthenticated());
    Auth0.handleAuthCallback((err) => {
      if (err) console.log(err);
    });
    Auth0.subscribe((authenticated) => {
      if(authenticated) {
        this._router.navigate(['/home'], {replaceUrl: true})
      }
    });
  }

  login(): void {
    Auth0.signIn();
  }
}