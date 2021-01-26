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
import { AuthService } from './shared/services/auth/auth.service';



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
  providers: [
    HttpRequestInterceptorProvider, 
    AuthService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

