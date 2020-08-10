import { Component, OnInit, ViewEncapsulation, ElementRef  } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { GmbService } from '../gmb.service';
import { Gmb } from 'src/app/shared/models/gmb.model';
import { NgIf, Location } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-gmb-summary',
  templateUrl: './gmb-summary.component.html',
  styleUrls: ['./gmb-summary.component.scss']
})

export class GmbSummaryComponent implements OnInit {

  subscription: Subscription = new Subscription();
  gmb: Gmb;
  public location: Location;
  public listTitles: any[];
  
  constructor(
    private _gmbService: GmbService,
    location: Location,  
    private element: ElementRef, 
    private router: Router
    
  ) { 
    this.location = location;
  }

  ngOnInit(): void {
     this.getGmbSeo();

  }

  getTitle(){
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if(titlee.charAt(0) === '#'){
        titlee = titlee.slice( 1 );
    }
    for(var item = 0; item < this.listTitles.length; item++){
      if(this.listTitles[item].path === titlee){
          return this.listTitles[item].title;
      }
  }
  return 'Dashboard';
}

  
  getGmbSeo(): void {
    this.subscription.add(
      this._gmbService.getGmbSeo().subscribe((response : Gmb)=> { 
        console.log(response);
        this.gmb = response;
      })
    );
  }
  
}