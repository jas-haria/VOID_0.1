import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent, HTTP_INTERCEPTORS, HttpResponse } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { HttpRequestInterceptorService } from './services/http-request-interceptor.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

    constructor(private _httpInterceptorService: HttpRequestInterceptorService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.error instanceof Error) {
                    console.error('An error occurred:', error.error.message);
                } else {
                    console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
                }
                this._httpInterceptorService.addErrors(error);
                console.log('adding')
                return EMPTY;
            })
        );
    }
}


/**
 * Provider POJO for the interceptor
 */
export const HttpRequestInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: HttpRequestInterceptor,
    multi: true,
};