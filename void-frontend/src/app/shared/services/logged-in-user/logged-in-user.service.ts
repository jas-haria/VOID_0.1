import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class LoggedInUserService {

  private loggedInUser = new BehaviorSubject<User>(null);

  constructor() { }

  updateUser(user: User): void {
    console.log(user)
    this.loggedInUser.next(user);
  }

  getUserAsObservable(): Observable<User> {
    return this.loggedInUser.asObservable();
  }
}
