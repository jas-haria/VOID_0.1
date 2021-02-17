import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../shared/gaurd/auth.guard';
import { SharedModule } from '../shared/shared.module';

const HomeRoute: Routes = [
  { path: 'home', canActivate: [AuthGuard], component: HomeComponent }
];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(HomeRoute),
    SharedModule
  ]
})
export class HomeModule { }
