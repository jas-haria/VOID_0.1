import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css'],
})
export class CallbackComponent implements OnInit {
  constructor(private _auth: AuthService) {}

  ngOnInit() {
    this._auth.handleAuthCallback();
  }
}