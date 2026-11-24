import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../../core/auth.service';
import { DashboardDataService } from '../../core/domain.services';
import { DashboardKpis } from '../../core/models';
import { NotifyService } from '../../shared/feedback';
import { EmptyStateComponent } from '../../shared/ui';

const INK_3 = '#7a8273';
const GRID = '#eceae2';
const FONT = { family: 'Inter, system-ui, sans-serif', size: 12 };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, RouterLink, BaseChartDirective, EmptyStateComponent],
  template: `
    <div class="page">
      <header class="hello">
        <div>
          <p class="date">{{ today }}</p>
          <h1>Bonjour{{ firstName() ? ', ' + firstName() : '' }}</h1>
          <p class="muted">Voici l'état de la campagne oléicole en cours.</p>
        </div>
        <div class="quick">
          <a class="quick-link" routerLink="/map"><mat-icon>map</mat-icon> Carte</a>
          <a class="quick-link" routerLink="/harvests"><mat-icon>shopping_basket</mat-icon> Récoltes</a>
          <a class="quick-link" routerLink="/alerts"><mat-icon>notification_important</mat-icon> Alertes</a>
        </div>
      </header>

      <section class="kpis" aria-label="Indicateurs clés">
        @if (kpis; as k) {
          <article class="kpi">
            <div class="kpi-icon olive"><mat-icon>shopping_basket</mat-icon></div>
            <span class="kpi-label">Récolte totale</span>
            <strong class="kpi-value">{{ k.totalHarvestedKg / 1000 | number: '1.0-1' }} <small>t</small></strong>
            <span class="kpi-foot">{{ k.yieldPerOrchard.length }} oliveraies récoltées</span>
          </article>
          <article class="kpi">
            <div class="kpi-icon gold"><mat-icon>factory</mat-icon></div>
            <span class="kpi-label">Reçu aux pressoirs</span>
            <strong class="kpi-value">{{ k.totalReceivedKg / 1000 | number: '1.0-1' }} <small>t</small></strong>
            <div class="meter"><span [style.width.%]="receivedShare()"></span></div>
            <span class="kpi-foot">{{ receivedShare() | number: '1.0-0' }} % de la récolte</span>
          </article>
          <article class="kpi">
            <div class="kpi-icon info"><mat-icon>schedule</mat-icon></div>
            <span class="kpi-label">Délai moyen de collecte</span>
            <strong class="kpi-value">{{ k.averageCollectionDelayDays | number: '1.0-1' }} <small>jours</small></strong>
            <span class="kpi-foot">entre demande et récolte</span>
          </article>
          <article class="kpi">
            <div class="kpi-icon" [class.danger]="k.binFillRate > 1" [class.olive]="k.binFillRate <= 1"><mat-icon>inventory_2</mat-icon></div>
            <span class="kpi-label">Rotation des caisses</span>
            <strong class="kpi-value">{{ k.binFillRate * 100 | number: '1.0-0' }} <small>%</small></strong>
            <div class="meter" [class.danger]="k.binFillRate > 1"><span [style.width.%]="Math.min(k.binFillRate * 100, 100)"></span></div>
            <span class="kpi-foot">reçu / capacité ({{ k.totalBinCapacityKg / 1000 | number: '1.0-0' }} t)</span>
          </article>
        } @else {
          @for (i of [1, 2, 3, 4]; track i) { <div class="kpi skeleton" style="height: 150px"></div> }
        }
      </section>

      <section class="grid-2">
        <article class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>leaderboard</mat-icon> Meilleurs rendements</div>
              <div class="card-subtitle">Top 10 des oliveraies, en kg par hectare</div>
            </div>
          </div>
          @if (kpis && !kpis.yieldPerOrchard.length) {
            <app-empty icon="bar_chart" title="Aucune récolte enregistrée" />
          } @else {
            <div class="chart"><canvas baseChart [data]="yieldData" [options]="barOptions" type="bar"></canvas></div>
          }
        </article>
        <article class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>task_alt</mat-icon> Alertes résolues</div>
              <div class="card-subtitle">Par semaine ISO</div>
            </div>
          </div>
          @if (kpis && !kpis.alertsResolvedPerWeek.length) {
            <app-empty icon="show_chart" title="Aucune alerte résolue" />
          } @else {
            <div class="chart"><canvas baseChart [data]="alertData" [options]="lineOptions" type="line"></canvas></div>
          }
        </article>
      </section>
    </div>
  `,
  styles: [`
    .hello { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .hello h1 { font-family: var(--font-display); font-size: 32px; font-weight: 600; }
    .hello .date { margin: 0 0 2px; color: var(--olive-600); font-weight: 600; font-size: 13px; text-transform: capitalize; }
    .hello .muted { margin: 4px 0 0; }
    .quick { display: flex; gap: 8px; flex-wrap: wrap; }
    .quick-link {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px;
      background: var(--surface); border: 1px solid var(--border); color: var(--ink-2);
      text-decoration: none; font-weight: 500; font-size: 13px;
    }
    .quick-link:hover { border-color: var(--olive-300); color: var(--ink); }
    .quick-link .mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--olive-600); }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 16px; }
    .kpi {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow-sm);
    }
    .kpi.skeleton { border: 0; }
    .kpi-icon { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; margin-bottom: 6px; }
    .kpi-icon .mat-icon { font-size: 21px; width: 21px; height: 21px; }
    .kpi-icon.olive { background: var(--olive-100); color: var(--olive-700); }
    .kpi-icon.gold { background: var(--gold-100); color: var(--gold-600); }
    .kpi-icon.info { background: var(--info-bg); color: var(--info); }
    .kpi-icon.danger { background: var(--danger-bg); color: var(--danger); }
    .kpi-label { color: var(--ink-3); font-size: 13px; font-weight: 500; }
    .kpi-value { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
    .kpi-value small { font-size: 15px; font-weight: 500; color: var(--ink-3); }
    .kpi-foot { font-size: 12px; color: var(--ink-3); }
    .kpi .meter { margin: 2px 0; }
    .chart { position: relative; height: 320px; }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardDataService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);

  protected readonly Math = Math;
  readonly today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  readonly firstName = computed(() => this.auth.user()?.fullName?.split(' ')[0] ?? '');
  private readonly kpiState = signal<DashboardKpis | null>(null);
  readonly receivedShare = computed(() => {
    const k = this.kpiState();
    return k && k.totalHarvestedKg ? Math.min((k.totalReceivedKg / k.totalHarvestedKg) * 100, 100) : 0;
  });

  kpis: DashboardKpis | null = null;

  yieldData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'kg/ha', data: [] }] };
  alertData: ChartData<'line'> = { labels: [], datasets: [{ label: 'alertes', data: [] }] };

  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    animation: { duration: 400 },
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${Math.round(ctx.parsed.x ?? 0)} kg/ha` } }
    },
    scales: {
      x: { grid: { color: GRID }, border: { display: false }, ticks: { color: INK_3, font: FONT } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: INK_3, font: FONT } }
    }
  };

  readonly lineOptions: ChartOptions<'line'> = {
    responsive: true,
    animation: { duration: 400 },
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: INK_3, font: FONT } },
      y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { color: INK_3, font: FONT, precision: 0 } }
    }
  };

  ngOnInit(): void {
    this.dashboard.kpis().subscribe({
      next: result => {
        this.kpis = result;
        this.kpiState.set(result);
        const top = [...result.yieldPerOrchard].sort((a, b) => b.yieldKgPerHa - a.yieldKgPerHa).slice(0, 10);
        this.yieldData = {
          labels: top.map(item => item.orchardName),
          datasets: [{
            label: 'kg/ha',
            data: top.map(item => item.yieldKgPerHa),
            backgroundColor: top.map((_, index) => (index < 3 ? '#4d7034' : '#b4c98a')),
            borderRadius: 6,
            barThickness: 18
          }]
        };
        this.alertData = {
          labels: result.alertsResolvedPerWeek.map(item => item.week.replace(/^\d{4}-W/, 'S')),
          datasets: [{
            label: 'alertes',
            data: result.alertsResolvedPerWeek.map(item => item.count),
            borderColor: '#c99a26',
            backgroundColor: 'rgba(201, 154, 38, 0.12)',
            pointBackgroundColor: '#c99a26',
            pointRadius: 4,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true
          }]
        };
      },
      error: error => this.notify.error(error)
    });
  }
}
