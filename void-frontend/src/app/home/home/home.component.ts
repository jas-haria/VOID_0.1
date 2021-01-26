import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/shared/models/user.model';
import { LoggedInUserService } from 'src/app/shared/services/logged-in-user/logged-in-user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private _loggedInUserService: LoggedInUserService) { }

  ngOnInit() {

  }

}
