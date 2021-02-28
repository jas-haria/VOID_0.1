import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { QuoraService } from 'src/app/quora/quora.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';
import { Router } from '@angular/router';
import { QuoraQuestionAccountAction } from 'src/app/shared/models/enums/quora-question-account-action.enum';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  subscription: Subscription = new Subscription();

  isCollapsed: boolean = false;
  expandedQuora: boolean = false;
  expandedQuoraQuestions: boolean = false;
  expandedQuoraQuestionsTab: string[] = [QuoraQuestionAccountAction.NEW, QuoraQuestionAccountAction.REQUESTED, QuoraQuestionAccountAction.ASKED];
  expandedQuoraAccounts: boolean = false;
  expandedArchieve = false;
  expandedArchieveQuestionsTab: string[] = [QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.ASKED]
  quoraAccounts: QuoraAccount[] = [];

  constructor(private _quoraService: QuoraService,
    private _router: Router) { }

  ngOnInit(): void {
    this.subscription.add(
      this._quoraService.getAccounts().subscribe(response => {
        this.quoraAccounts = response.filter(account =>  account.email != 'unavailable');
        this.quoraAccounts = [...this.quoraAccounts, response.find(account => account.email == 'unavailable')];
      })
    );
  }

  navigate(url: string): void {
    this._router.navigate([url]);
  }

}
