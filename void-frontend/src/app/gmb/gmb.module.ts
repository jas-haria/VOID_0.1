import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GmbSummaryComponent } from './gmb-summary/gmb-summary.component';
import { GmbCentreComponent} from './gmb-centre/gmb-centre.component';
import { RouterModule, Routes } from '@angular/router';
import { GmbService } from './gmb.service';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AdminLayoutComponent } from '../layouts/admin-layout/admin-layout.component';



export const GmbRoutes: Routes = [
  { path: 'gmb', children: [
      { path: 'summary', component: AdminLayoutComponent, children: [
        { path: '', component: GmbSummaryComponent },
      ]
    },
      { path: 'centre', component: AdminLayoutComponent, children: [
        { path: '', component: GmbCentreComponent },
      ] }
    ]
  }
];

@NgModule({
  declarations: [
    GmbSummaryComponent,
    GmbCentreComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(GmbRoutes),
    SharedModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatButtonToggleModule
  ],
  exports : [
    RouterModule
  ],
  providers : [
    GmbService
  ]
})
export class GmbModule { }