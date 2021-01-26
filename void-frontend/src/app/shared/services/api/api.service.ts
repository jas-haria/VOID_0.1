import { Injectable } from '@angular/core';
import { HttpParams, HttpHeaders, HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private backendUrl: string = 'http://localhost:5000';

  constructor(private _http: HttpClient,
    private _authService: AuthService) { }

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

  getHeaders(accessToken: string, avoidCache: boolean): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.append('Authorization', `Bearer ${accessToken}`);
    if (avoidCache) {
      headers = headers.append('Cache-Control', 'no-cache, no-store, must-revalidate, post- check=0, pre-check=0');
      headers = headers.append('Pragma', 'no-cache');
      headers = headers.append('Expires', '0');
    }
    return headers;
  }

  createRequest(method: string, url: string, parameters: any, body: FormData, avoidCache: boolean, responseType: string): Observable<Object> {
    return this._authService.getAccessToken().pipe(switchMap((accessToken: string) => {
      let options = {};
      options['headers'] = this.getHeaders(accessToken, avoidCache);
      if (parameters) {
        options['params'] = this.getParameters(parameters);
      }
      if (responseType) {
        options['responseType'] = responseType;
      }
      switch (method) {
        case 'get': return this._http.get(this.backendUrl + url, options);
        case 'put': return this._http.put(this.backendUrl + url, body, options);
        case 'delete': return this._http.delete(this.backendUrl + url, options);
        case 'post': return this._http.post(this.backendUrl + url, body, options);
      }
    }));
  }
}
