import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardDataService } from '../../core/domain.services';
import { DashboardKpis } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  template: `
    <h1 class="page-title">Tableau de bord</h1>
    <div class="card-grid">
      <mat-card class="panel"><h3>Récolte totale</h3><strong>{{ kpis?.totalHarvestedKg | number: '1.0-0' }} kg</strong></mat-card>
      <mat-card class="panel"><h3>Délai moyen</h3><strong>{{ kpis?.averageCollectionDelayDays | number: '1.0-1' }} j</strong></mat-card>
      <mat-card class="panel"><h3>Taux de remplissage</h3><strong>{{ kpis?.binFillRate | number: '1.0-2' }}</strong></mat-card>
      <mat-card class="panel"><h3>Réceptions</h3><strong>{{ kpis?.totalReceivedKg | number: '1.0-0' }} kg</strong></mat-card>
    </div>
    <mat-card class="panel">
      <h3>Rendement par oliveraie</h3>
      <canvas baseChart [data]="yieldData" [options]="options" type="bar"></canvas>
    </mat-card>
    <mat-card class="panel">
      <h3>Alertes résolues par semaine</h3>
      <canvas baseChart [data]="alertData" [options]="options" type="line"></canvas>
    </mat-card>
  `,
  styles: [`.card-grid { margin-bottom: 16px; } canvas { max-height: 360px; }`]
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardDataService);

  kpis: DashboardKpis | null = null;
  options: ChartOptions = { responsive: true, maintainAspectRatio: false };
  yieldData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'kg/ha', data: [] }] };
  alertData: ChartData<'line'> = { labels: [], datasets: [{ label: 'alertes', data: [] }] };

  ngOnInit(): void {
    this.dashboard.kpis().subscribe(result => {
      this.kpis = result;
      this.yieldData = {
        labels: result.yieldPerOrchard.map(item => item.orchardName),
        datasets: [{ label: 'kg/ha', data: result.yieldPerOrchard.map(item => item.yieldKgPerHa) }]
      };
      this.alertData = {
        labels: result.alertsResolvedPerWeek.map(item => item.week),
        datasets: [{ label: 'alertes', data: result.alertsResolvedPerWeek.map(item => item.count) }]
      };
    });
  }
}
