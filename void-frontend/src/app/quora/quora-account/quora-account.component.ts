import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderService } from 'src/app/shared/services/header.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { QuoraService } from '../quora.service';
import { QuoraAccount } from 'src/app/shared/models/quora-account.model';

@Component({
  selector: 'app-quora-account',
  templateUrl: './quora-account.component.html',
  styleUrls: ['./quora-account.component.css']
})
export class QuoraAccountComponent implements OnInit, OnDestroy {

  subscription: Subscription = new Subscription();

  account: QuoraAccount;

  constructor(private _route: ActivatedRoute,
    private _headerService: HeaderService,
    private _quoraService: QuoraService) { }

  ngOnInit(): void {
     this.subscription.add(
      this._route.paramMap.subscribe(params => {
        this._quoraService.getAccount(parseInt(params.get('id'))).subscribe((response: QuoraAccount) => {
          this.account = response;
          this._headerService.updateHeader(this.account.first_name + " " + this.account.last_name);
        })
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._headerService.releaseHeader();
  }

}
