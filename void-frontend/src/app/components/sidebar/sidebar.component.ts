import { Component, OnInit } from '@angular/core';
import { Router,Routes,RouterModule } from '@angular/router';

declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}
export const ROUTES: RouteInfo[] = [
    //{ path: '/dashboard', title: 'Dashboard',  icon: 'ni-tv-2 text-primary', class: '' },
    //{ path: '/icons', title: 'Icons',  icon:'ni-planet text-blue', class: '' },
    //{ path: '/maps', title: 'Maps',  icon:'ni-pin-3 text-orange', class: '' },
    //{ path: '/user-profile', title: 'User profile',  icon:'ni-single-02 text-yellow', class: '' },
    //{ path: '/tables', title: 'Tables',  icon:'ni-bullet-list-67 text-red', class: '' },
    //{ path: '/login', title: 'Login',  icon:'ni-key-25 text-info', class: '' },
    //{ path: '/register', title: 'Register',  icon:'ni-circle-08 text-pink', class: '' },
    { path: '/gmb/gmb-summary', title: 'Summary',  icon:'ni-tv-2 text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Andheri',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Borivali-BB',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Borivali-LM',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'BSJC',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Chembur',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Dadar-HO',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Dadar - VH',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Dombivli',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Ghatkopar',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Kalyan',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Kandivali',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Nerul',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Panvel',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Pune-FC Road',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Pune-PCMC ',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'RWJC',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Thane-IA',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Thane-NW',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Thane-PA',  icon:'ni ni-building text-primary', class: '' },
    { path: '/gmb/gmb-centre', title: 'Vashi',  icon:'ni ni-building text-primary', class: '' },
    
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  public menuItems: any[];
  public menuItems1: any[];
  public isCollapsed = true;

  constructor(private router: Router) { }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    this.menuItems1 = ROUTES.filter(menuItem => menuItem);
    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
   });
  }
}
