import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoraQuestionListComponent } from './quora-question-list/quora-question-list.component';
import { Routes, RouterModule } from '@angular/router';
import { QuoraService } from './quora.service';
import { SharedModule } from '../shared/shared.module';
import { QuoraAccountComponent } from './quora-account/quora-account.component';


export const QuoraRoutes: Routes = [
  { path: 'quora', children: [
      { path: 'questions-list/:type/:accountId', component: QuoraQuestionListComponent, pathMatch: 'full' },
      { path: 'questions-list/:type', component: QuoraQuestionListComponent, pathMatch: 'full' },
      { path: 'account/:id', component: QuoraAccountComponent, pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    QuoraQuestionListComponent,
    QuoraAccountComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(QuoraRoutes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    QuoraService
  ]
})

export class QuoraModule { }
