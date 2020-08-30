import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestInterceptorService {

  private errors = new Subject<any>();

  private showSpinner = new Subject<boolean>();

  public addErrors(errors: any): void {
    console.log("error")
    this.errors.next(errors);
  }

  public getErrors(): Observable<any> {
    return this.errors.asObservable();
  }

  public displaySpinner(value: boolean): void {
    this.showSpinner.next(value);
  }

  public getSpinnerDisplay(): Observable<boolean> {
    return this.showSpinner.asObservable();
  }

  constructor() { }
}
