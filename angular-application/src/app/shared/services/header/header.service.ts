import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  defaultHeader: string = "Online Integrated Dashboard";
  private header = new BehaviorSubject<string>(this.defaultHeader);

  constructor() { }

  updateHeader(newHeader: string): void {
    this.header.next(newHeader);
  }

  releaseHeader(): void {
    this.header.next(this.defaultHeader);
  }

  getHeaderObservable(): Observable<string> {
    return this.header.asObservable();
  }

  getHeaderValue(): string {
    return this.header.getValue();
  }
}
