import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatChipsModule} from '@angular/material/chips';
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { TableComponent } from './components/table/table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChartComponent } from './components/chart/chart.component';
import { TopCardComponent } from './components/top-card/top-card.component';
import { ModalComponent } from './components/modal/modal.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatFormFieldModule } from '@angular/material/form-field';



@NgModule({
  declarations: [
    TableComponent,
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
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
    ClipboardModule,
    MatChipsModule,
    MatFormFieldModule
  ],
  exports: [
    TableComponent,
    NgbModule,
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    ChartComponent,
    TopCardComponent,
    ModalComponent,
    ClipboardModule,
    MatChipsModule,
    MatFormFieldModule
  ],
  providers: []
})
export class SharedModule { }
