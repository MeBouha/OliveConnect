import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth.service';
import { AlertDataService, OrchardDataService } from '../../core/domain.services';
import { LookupService } from '../../core/lookup.service';
import { Alert, Orchard } from '../../core/models';
import { NotifyService } from '../../shared/feedback';
import { labelOf, optionsOf } from '../../shared/labels';
import { EmptyStateComponent, PageHeaderComponent, SkeletonRowsComponent, StatusComponent } from '../../shared/ui';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    PageHeaderComponent, StatusComponent, EmptyStateComponent, SkeletonRowsComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Alertes terrain" icon="notification_important"
                       subtitle="Maturité, météo et ravageurs signalés sur les oliveraies">
        @if (canCreate()) {
          <button mat-flat-button (click)="toggleCreate()">
            <mat-icon>{{ showCreate() ? 'close' : 'add_alert' }}</mat-icon> {{ showCreate() ? 'Fermer' : 'Signaler' }}
          </button>
        }
      </app-page-header>

      @if (showCreate()) {
        <form class="card" (ngSubmit)="create()" #alertForm="ngForm">
          <div class="card-header"><div class="card-title"><mat-icon>add_alert</mat-icon> Nouvelle alerte</div></div>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Oliveraie</mat-label>
              <mat-select name="orchardId" [(ngModel)]="form.orchardId" required>
                @for (orchard of orchards(); track orchard.id) { <mat-option [value]="orchard.id">{{ orchard.name }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Type</mat-label>
              <mat-select name="type" [(ngModel)]="form.type" required>
                @for (type of types; track type.value) {
                  <mat-option [value]="type.value"><mat-icon>{{ type.icon }}</mat-icon> {{ type.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field class="span-all">
              <mat-label>Description</mat-label>
              <textarea matInput name="description" [(ngModel)]="form.description" required rows="2"
                        placeholder="Ex. : mouche de l'olive observée sur la parcelle nord"></textarea>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button type="button" (click)="showCreate.set(false)">Annuler</button>
            <button mat-flat-button type="submit" [disabled]="alertForm.invalid || saving()"><mat-icon>send</mat-icon> Envoyer</button>
          </div>
        </form>
      }

      <div class="tabs" role="tablist">
        @for (tab of tabs; track tab.value) {
          <button type="button" role="tab" class="tab" [class.on]="filter() === tab.value" (click)="filter.set(tab.value)">
            {{ tab.label }} <span class="n">{{ countOf(tab.value) }}</span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="card flush"><app-skeleton-rows [rows]="4" /></div>
      } @else if (!filtered().length) {
        <div class="card"><app-empty icon="task_alt" title="Rien à signaler" hint="Aucune alerte dans cette catégorie." /></div>
      } @else {
        <div class="alert-list">
          @for (alert of filtered(); track alert.id) {
            <article class="alert-card" [class]="'t-' + typeOf(alert).tone">
              <div class="alert-icon"><mat-icon>{{ typeOf(alert).icon }}</mat-icon></div>
              <div class="alert-body">
                <div class="alert-top">
                  <strong>{{ typeOf(alert).label }}</strong>
                  <app-status kind="alertStatus" [value]="alert.status" />
                </div>
                <p>{{ alert.description }}</p>
                <div class="meta">
                  <span><mat-icon>park</mat-icon>{{ lookup.orchardName(alert.orchardId) }}</span>
                  <span><mat-icon>schedule</mat-icon>{{ alert.createdAt | date: 'd MMM y, HH:mm' }}</span>
                  @if (alert.resolvedAt) { <span><mat-icon>task_alt</mat-icon>résolue le {{ alert.resolvedAt | date: 'd MMM' }}</span> }
                </div>
              </div>
              @if (canHandle() && alert.status !== 'RESOLVED') {
                <div class="alert-actions">
                  @if (alert.status === 'OPEN') {
                    <button mat-stroked-button (click)="setStatus(alert, 'ACKNOWLEDGED')">Prendre en charge</button>
                  }
                  <button mat-flat-button (click)="setStatus(alert, 'RESOLVED')"><mat-icon>check</mat-icon> Résoudre</button>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab {
      display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--surface); font: inherit; font-size: 13px; font-weight: 500;
      color: var(--ink-2); cursor: pointer;
    }
    .tab.on { background: var(--olive-700); border-color: var(--olive-700); color: #fff; }
    .tab .n { font-size: 11px; font-weight: 700; padding: 0 7px; border-radius: 999px; background: var(--neutral-bg); color: var(--ink-2); line-height: 18px; }
    .tab.on .n { background: rgba(255,255,255,0.2); color: #fff; }
    .alert-list { display: flex; flex-direction: column; gap: 12px; }
    .alert-card {
      display: flex; gap: 16px; align-items: flex-start; padding: 16px 20px; background: var(--surface);
      border: 1px solid var(--border); border-left: 4px solid var(--neutral); border-radius: var(--radius); flex-wrap: wrap;
    }
    .alert-card.t-danger { border-left-color: var(--danger); }
    .alert-card.t-info { border-left-color: var(--info); }
    .alert-card.t-olive { border-left-color: var(--olive-600); }
    .alert-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--neutral-bg); color: var(--neutral); flex: none; }
    .t-danger .alert-icon { background: var(--danger-bg); color: var(--danger); }
    .t-info .alert-icon { background: var(--info-bg); color: var(--info); }
    .t-olive .alert-icon { background: var(--olive-100); color: var(--olive-700); }
    .alert-body { flex: 1 1 300px; min-width: 0; }
    .alert-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .alert-body p { margin: 4px 0 8px; color: var(--ink-2); }
    .meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--ink-3); }
    .meta span { display: inline-flex; align-items: center; gap: 4px; }
    .meta .mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .alert-actions { display: flex; gap: 8px; align-self: center; flex-wrap: wrap; }
    mat-option .mat-icon { vertical-align: -5px; }
  `]
})
export class AlertsComponent implements OnInit {
  private readonly service = inject(AlertDataService);
  private readonly orchardService = inject(OrchardDataService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  readonly lookup = inject(LookupService);

  readonly types = optionsOf('alertType');
  readonly tabs = [
    { value: 'ACTIVE', label: 'À traiter' },
    { value: 'RESOLVED', label: 'Résolues' },
    { value: 'ALL', label: 'Toutes' }
  ];
  readonly canCreate = computed(() => this.auth.hasRole('FARMER', 'TEAM_LEADER', 'COLLECTION_MANAGER'));
  readonly canHandle = computed(() => this.auth.hasRole('TEAM_LEADER', 'COLLECTION_MANAGER'));

  readonly alerts = signal<Alert[]>([]);
  readonly orchards = signal<Orchard[]>([]);
  readonly filter = signal('ACTIVE');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showCreate = signal(false);
  readonly filtered = computed(() => this.alerts().filter(alert => this.matches(alert, this.filter())));

  form = { orchardId: '', type: 'MATURITY_OPTIMAL', description: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe({
      next: page => {
        const sorted = [...page.content].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        this.alerts.set(sorted);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  typeOf(alert: Alert) {
    return labelOf('alertType', alert.type);
  }

  countOf(filter: string): number {
    return this.alerts().filter(alert => this.matches(alert, filter)).length;
  }

  private matches(alert: Alert, filter: string): boolean {
    if (filter === 'ACTIVE') {
      return alert.status !== 'RESOLVED';
    }
    return filter === 'ALL' || alert.status === filter;
  }

  toggleCreate(): void {
    this.showCreate.set(!this.showCreate());
    if (this.showCreate() && !this.orchards().length) {
      this.orchardService.list({ size: 100 }).subscribe(page => {
        this.orchards.set(page.content);
        this.lookup.remember(page.content);
        this.form.orchardId ||= page.content[0]?.id ?? '';
      });
    }
  }

  create(): void {
    const orchard = this.orchards().find(item => item.id === this.form.orchardId);
    this.saving.set(true);
    this.service.create({
      orchardId: this.form.orchardId,
      type: this.form.type,
      description: this.form.description.trim(),
      status: 'OPEN',
      location: orchard?.geometry ?? { type: 'Point', coordinates: [10.76, 34.74] }
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Alerte envoyée');
        this.form.description = '';
        this.showCreate.set(false);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }

  setStatus(alert: Alert, status: Alert['status']): void {
    this.service.updateStatus(alert.id!, status).subscribe({
      next: () => {
        this.notify.success(status === 'RESOLVED' ? 'Alerte résolue' : 'Alerte prise en charge');
        this.load();
      },
      error: error => this.notify.error(error)
    });
  }
}
