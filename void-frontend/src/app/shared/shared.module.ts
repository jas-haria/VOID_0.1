import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { TableComponent } from './components/table/table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Sidebar2Component } from './components/sidebar2/sidebar2.component';


@NgModule({
  declarations: [
    TableComponent,
    FooterComponent,
    NavbarComponent,
    Sidebar2Component
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgbModule,
  ],
  exports: [
    TableComponent,
    NgbModule,
    FooterComponent,
    NavbarComponent,
    Sidebar2Component
  ]
})
export class SharedModule { }
