import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ChartDetails } from '../../models/chart-details.model';
import { Observable, Subscription } from 'rxjs';
import Chart from 'chart.js';
import { parseOptions, chartOptions } from 'src/app/variables/charts';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnDestroy {

  @Input('chart') chart: ChartDetails;
  @Input('weekLabels') weekLabels: any[];
  @Input('monthLabels') monthLabels: any[];
  @Input('createOrRecreate') createOrRecreate: Observable<string>;
  @Input('update') update: Observable<string>;

  subscription: Subscription = new Subscription();

  constructor() { }

  ngOnInit(): void {
    parseOptions(Chart, chartOptions());
    this.subscription.add(
      this.createOrRecreate.subscribe(name => {
        if (this.chart.name == name) {
          this.createOrRecreateChart();
        }
      })
    ).add(
      this.update.subscribe(name => {
        if (this.chart.name == name) {
          this.updateChart();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.chart.chart) {
      this.chart.chart.destroy();
    }
  }

  createOrRecreateChart(): void {
    if (this.chart.chart) this.chart.chart.destroy();
    let chartInView = document.getElementById(this.chart.name);
    if (chartInView) {
      this.chart.chart = new Chart(chartInView, {
        type: this.chart.barSelected ? 'bar' : 'line',
        data: {
          labels: this.chart.monthSelected? this.monthLabels: this.weekLabels,
          datasets: [{
            labels: this.chart.title,
            data: (this.chart.data && this.chart.data.length > 0) ? (this.chart.monthSelected ? this.chart.data : this.chart.data.slice(23, 30)) : []
          }]
        }
      });
    }
  }

  updateChart(): void {
      this.chart.chart.data.labels = this.chart.monthSelected ? this.monthLabels : this.weekLabels;
      if (this.chart.data) {
        this.chart.chart.data.datasets[0].data = this.chart.monthSelected ? this.chart.data : this.chart.data.slice(23, 30)
      }
      this.chart.chart.update();
    }

}
