import { Component, OnInit } from '@angular/core';
import { OktaAuthService } from '@okta/okta-angular';
import { User } from 'src/app/shared/models/user.model';
import { LoggedInUserService } from 'src/app/shared/services/logged-in-user/logged-in-user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private _okAuth: OktaAuthService,
    private _loggedInUserService: LoggedInUserService) { }

  async ngOnInit() {
    const isAuthenticated = this._okAuth.isAuthenticated();
    if (isAuthenticated) {
      this._okAuth.getUser().then(userDetails => {
        let user: User = new User();
        user.email = userDetails.email;
        user.admin = userDetails.groups.find(groupName => groupName === "Admin")? true: false;
        this._loggedInUserService.updateUser(user);
      });
    }
  }

}
