import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoraQuestionListComponent } from './quora-question-list/quora-question-list.component';
import { Routes, RouterModule } from '@angular/router';
import { QuoraService } from './quora.service';
import { SharedModule } from '../shared/shared.module';


export const QuoraRoutes: Routes = [
  { path: 'quora', children: [
      { path: 'questions-list/:type', component: QuoraQuestionListComponent, pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    QuoraQuestionListComponent
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
