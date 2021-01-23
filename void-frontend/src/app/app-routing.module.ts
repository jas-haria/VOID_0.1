import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule  } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { OktaAuthGuard, OktaAuthModule, OktaCallbackComponent, OKTA_CONFIG } from '@okta/okta-angular';
import { LoginModule } from './login/login.module';

const oktaConfig = {
  issuer: 'https://dev-3128210.okta.com/oauth2/default',
  clientId: '0oa3m9c5rTyDl5Z7I5d6',
  redirectUri: window.location.origin + '/callback',
  scope: 'openid profile email'
}

const routes: Routes =[
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  }, {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivateChild: [OktaAuthGuard],
    children: [
      {
        path: '',
        loadChildren: './layouts/authenticated-layout/authenticated-layout.module#AuthenticatedLayoutModule'
      }
    ]
  }, { 
    path: 'callback',
    component: OktaCallbackComponent 
  }, {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes),
    OktaAuthModule,
    LoginModule
  ],
  exports: [
    RouterModule
  ],
  providers: [
    { provide: OKTA_CONFIG, useValue: oktaConfig }
  ]
})
export class AppRoutingModule { }