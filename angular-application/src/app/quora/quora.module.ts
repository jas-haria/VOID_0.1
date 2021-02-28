import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoraQuestionListComponent } from './quora-question-list/quora-question-list.component';
import { Routes, RouterModule } from '@angular/router';
import { QuoraService } from './quora.service';
import { SharedModule } from '../shared/shared.module';
import { QuoraAccountComponent } from './quora-account/quora-account.component';
import { QuoraSummaryComponent } from './quora-summary/quora-summary.component';
import { QuoraKeywordComponent } from './quora-keyword/quora-keyword.component';
import { AuthGuard } from '../shared/gaurd/auth.guard';
import { QuoraArchievedComponent } from './quora-archieved/quora-archieved.component';


export const QuoraRoutes: Routes = [
  { path: 'quora', canActivate: [AuthGuard], children: [
      { path: 'summary', component: QuoraSummaryComponent, pathMatch: 'full' },
      { path: 'questions-list/:type/:accountId', component: QuoraQuestionListComponent, pathMatch: 'full' },
      { path: 'questions-list/:type', component: QuoraQuestionListComponent, pathMatch: 'full' },
      { path: 'archieve/:type/:accountId', component: QuoraArchievedComponent, pathMatch: 'full' },
      { path: 'archieve/:type', component: QuoraArchievedComponent, pathMatch: 'full' },
      { path: 'account/:id', component: QuoraAccountComponent, pathMatch: 'full' },
      { path: 'keywords', component: QuoraKeywordComponent, pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    QuoraQuestionListComponent,
    QuoraAccountComponent,
    QuoraSummaryComponent,
    QuoraKeywordComponent,
    QuoraArchievedComponent
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
