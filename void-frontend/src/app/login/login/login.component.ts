import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  currentDate: Date = new Date();
  subscription: Subscription = new Subscription();

  constructor(private _router: Router,
     private _authService: AuthService) {}

  ngOnInit() {
    this.subscription.add(
      this._authService.isAuthenticated$.subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this._router.navigate(["../home"]);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  login(): void {
    this._authService.login();
  }
}