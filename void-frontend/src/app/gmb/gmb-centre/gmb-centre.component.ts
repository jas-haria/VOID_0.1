import { Component, OnInit, ViewEncapsulation, ElementRef  } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { GmbService } from '../gmb.service';
import { Gmb } from 'src/app/shared/models/gmb.model';
import { NgIf, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ROUTES } from 'src/app/components/sidebar/sidebar.component';

@Component({
  selector: 'app-gmb-centre',
  templateUrl: './gmb-centre.component.html',
  styleUrls: ['./gmb-centre.component.scss']
})
export class GmbCentreComponent implements OnInit {

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
    this.listTitles = ROUTES.filter(listTitle => listTitle);
    this.getGmbCentre();
    this.getGmbInsights();
    this.getTitle();

  }

  getTitle(){
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if(titlee.charAt(0) === '#'){
        titlee = titlee.slice( 1 );
    }
    for(var item = 0; item < this.listTitles.length; item++){
      if(this.listTitles[item].path === titlee){
          console.log(this.listTitles[item].data);
          return this.listTitles[item].title;
      }
  }
  return 'Dashboard';
}

  
  
  getGmbCentre(): void {
    this.subscription.add(
      this._gmbService.getGmbCentre().subscribe((response : Gmb)=> { 
        console.log(response);
        this.gmb = response;
        console.log(this.gmb.average_rating)
      })
    );
  }
  
  getGmbInsights(): void {
  this.subscription.add(
    this._gmbService.getGmbInsights().subscribe(response => { 
      console.log(response);
    })
  );
  }
  
}