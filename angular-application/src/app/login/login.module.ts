import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CallbackComponent } from './callback/callback.component';


export const LoginRoute: Routes = [
  {
    path: 'login',
    component: LoginComponent
  }, {
    path: 'callback',
    component: CallbackComponent
  }
]

@NgModule({
  declarations: [
    LoginComponent,
    CallbackComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(LoginRoute)
  ],
  exports: [
    RouterModule
  ]
})
export class LoginModule { }
