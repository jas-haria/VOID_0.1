import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { SharedModule } from './shared/shared.module';
import { HttpRequestInterceptorProvider } from './shared/services/http-request-interceptor/http-request-interceptor';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import * as Auth0 from 'auth0-web';



@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    BrowserModule
  ],
  declarations: [
    AppComponent,
    AuthenticatedLayoutComponent,
  ],
  providers: [HttpRequestInterceptorProvider],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    Auth0.configure({
      domain: 'dev-void.us.auth0.com',
      audience: 'dev_void_be',
      clientID: 'TecKzu7OhQKztXweiBO5Lv8pDSffkpfh',
      redirectUri: 'http://localhost:4200/login',
      scope: 'openid profile'
    });
  }
 }

