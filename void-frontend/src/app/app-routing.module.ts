import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule  } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { LoginModule } from './login/login.module';

const routes: Routes =[
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  }, {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: './layouts/authenticated-layout/authenticated-layout.module#AuthenticatedLayoutModule'
      }
    ]
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
    LoginModule
  ],
  exports: [
    RouterModule
  ],
  providers: [ ]
})
export class AppRoutingModule { }