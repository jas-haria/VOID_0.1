import { Injectable } from '@angular/core';
import { HttpParams, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private backendUrl = 'http://localhost:5000'

  constructor() { }

  getBackendUrl(): string {
    return this.backendUrl;
  }

  getParameters(params: {}): HttpParams {
    let parameters = new HttpParams();
    for (var element in params) {
      if (params[element] instanceof Array) {
        parameters = parameters.append(element, JSON.stringify(params[element]));
      }
      else {
        parameters = parameters.append(element, params[element]);
      }
    }
    return parameters;
  }

  getHeadersToAvoidCache(): HttpHeaders {
    return new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate, post- check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
}
