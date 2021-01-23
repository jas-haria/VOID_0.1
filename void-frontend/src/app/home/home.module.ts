import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { OktaAuthGuard } from '@okta/okta-angular';
import { RouterModule, Routes } from '@angular/router';

const HomeRoute: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [OktaAuthGuard] }
];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(HomeRoute)
  ]
})
export class HomeModule { }
