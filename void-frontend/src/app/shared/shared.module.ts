import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { TableComponent } from './components/table/table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Sidebar2Component } from './components/sidebar2/sidebar2.component';
import { ChartComponent } from './components/chart/chart.component';
import { TopCardComponent } from './components/top-card/top-card.component';
import { ModalComponent } from './components/modal/modal.component';


@NgModule({
  declarations: [
    TableComponent,
    FooterComponent,
    NavbarComponent,
    Sidebar2Component,
    ChartComponent,
    TopCardComponent,
    ModalComponent,
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgbModule,
    MatProgressSpinnerModule
  ],
  exports: [
    TableComponent,
    NgbModule,
    FooterComponent,
    NavbarComponent,
    Sidebar2Component,
    ChartComponent,
    TopCardComponent,
    ModalComponent
  ],
  providers: []
})
export class SharedModule { }
