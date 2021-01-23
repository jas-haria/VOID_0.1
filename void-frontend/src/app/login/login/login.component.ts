import { Component, OnInit } from '@angular/core';
import { OktaAuthService } from '@okta/okta-angular';
import { Router } from '@angular/router';
import { LoggedInUserService } from 'src/app/shared/services/logged-in-user/logged-in-user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  currentDate: Date = new Date();

  constructor(private _oktaAuth: OktaAuthService,
     private _router: Router,
     private _loggedInUserService: LoggedInUserService) {}

  async ngOnInit() {
    this._loggedInUserService.updateUser(null);
    const isAuthenticated = await this._oktaAuth.isAuthenticated();
    if (isAuthenticated) {
      this._router.navigate(['/home'], {replaceUrl: true})
    }
  }

  async login(event) {
    event.preventDefault();
    await this._oktaAuth.loginRedirect('/home');
  }
}