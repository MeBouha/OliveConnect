import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth.service';
import { HarvestDataService, ResourceDataService, TourDataService } from '../../core/domain.services';
import { LookupService } from '../../core/lookup.service';
import { Harvest, Resource, Tour, UserSummary } from '../../core/models';
import { ConfirmService, NotifyService } from '../../shared/feedback';
import { labelOf, toLocalInput } from '../../shared/labels';
import { EmptyStateComponent, PageHeaderComponent, SkeletonRowsComponent, StatusComponent } from '../../shared/ui';

@Component({
  selector: 'app-tours',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatMenuModule, MatTooltipModule, PageHeaderComponent, StatusComponent, EmptyStateComponent, SkeletonRowsComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Tournées de collecte" icon="route"
                       [subtitle]="isLeader() ? 'Vos tournées assignées et leur avancement' : 'Planification des équipes et des moyens'">
        @if (isManager()) {
          <button mat-flat-button (click)="toggleCreate()">
            <mat-icon>{{ showCreate() ? 'close' : 'add' }}</mat-icon> {{ showCreate() ? 'Fermer' : 'Nouvelle tournée' }}
          </button>
        }
      </app-page-header>

      @if (showCreate()) {
        <form class="card" (ngSubmit)="create()" #tourForm="ngForm">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>add_road</mat-icon> Nouvelle tournée</div>
              <div class="card-subtitle">Regroupez jusqu'à 30 récoltes en attente.</div>
            </div>
          </div>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Code</mat-label>
              <input matInput name="code" [(ngModel)]="form.code" required />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Date et heure</mat-label>
              <input matInput type="datetime-local" name="plannedDate" [(ngModel)]="form.plannedDate" required />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Chef d'équipe</mat-label>
              <mat-select name="teamLeaderId" [(ngModel)]="form.teamLeaderId" required>
                @for (leader of leaders(); track leader.id) { <mat-option [value]="leader.id">{{ leader.fullName }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Récoltes en attente</mat-label>
              <mat-select name="harvestIds" [(ngModel)]="form.harvestIds" multiple>
                @for (harvest of pending(); track harvest.id) {
                  <mat-option [value]="harvest.id">
                    {{ lookup.orchardName(harvest.orchardId) }} · {{ harvest.type === 'URGENT' ? 'Urgente' : 'Normale' }}
                  </mat-option>
                } @empty {
                  <mat-option disabled>Aucune récolte en attente</mat-option>
                }
              </mat-select>
              <mat-hint>{{ form.harvestIds.length }} / 30</mat-hint>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Ressources</mat-label>
              <mat-select name="resourceIds" [(ngModel)]="form.resourceIds" multiple>
                @for (resource of resources(); track resource.id) {
                  <mat-option [value]="resource.id">{{ resource.name }} · {{ resourceType(resource.type) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button type="button" (click)="showCreate.set(false)">Annuler</button>
            <button mat-flat-button type="submit" [disabled]="tourForm.invalid || saving() || form.harvestIds.length > 30">
              <mat-icon>check</mat-icon> Créer la tournée
            </button>
          </div>
        </form>
      }

      <section class="card flush">
        @if (loading()) {
          <app-skeleton-rows [rows]="6" />
        } @else if (!tours().length) {
          <app-empty icon="route" title="Aucune tournée" hint="Les tournées planifiées apparaîtront ici." />
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Tournée</th><th>Date</th><th>Chef d'équipe</th><th>Contenu</th><th>Statut</th><th></th></tr>
              </thead>
              <tbody>
                @for (tour of tours(); track tour.id) {
                  <tr>
                    <td><div class="cell-main mono">{{ tour.code }}</div></td>
                    <td class="nowrap">
                      <div class="cell-main">{{ tour.plannedDate | date: 'EEE d MMM' }}</div>
                      <div class="cell-sub">{{ tour.plannedDate | date: 'HH:mm' }}</div>
                    </td>
                    <td>{{ leaderName(tour.teamLeaderId) }}</td>
                    <td class="nowrap muted">
                      <span class="count" matTooltip="Récoltes"><mat-icon>shopping_basket</mat-icon>{{ tour.harvestIds.length }}</span>
                      <span class="count" matTooltip="Ressources"><mat-icon>inventory_2</mat-icon>{{ tour.resourceIds.length }}</span>
                    </td>
                    <td><app-status kind="tourStatus" [value]="tour.status" /></td>
                    <td class="actions">
                      @if (canProgress(tour)) {
                        @if (tour.status === 'PLANNED') {
                          <button mat-flat-button (click)="progress(tour, 'IN_PROGRESS')"><mat-icon>play_arrow</mat-icon> Démarrer</button>
                        } @else if (tour.status === 'IN_PROGRESS') {
                          <button mat-flat-button (click)="progress(tour, 'COMPLETED')"><mat-icon>flag</mat-icon> Terminer</button>
                        }
                      }
                      @if (isManager() && (tour.status === 'PLANNED' || tour.status === 'IN_PROGRESS')) {
                        <button mat-icon-button matTooltip="Annuler la tournée" (click)="cancel(tour)" aria-label="Annuler">
                          <mat-icon>cancel</mat-icon>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .mono { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 13px; }
    .count { display: inline-flex; align-items: center; gap: 4px; margin-right: 12px; }
    .count .mat-icon { font-size: 16px; width: 16px; height: 16px; }
    td.actions button + button { margin-left: 4px; }
  `]
})
export class ToursComponent implements OnInit {
  private readonly service = inject(TourDataService);
  private readonly harvestService = inject(HarvestDataService);
  private readonly resourceService = inject(ResourceDataService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);
  readonly lookup = inject(LookupService);

  readonly isManager = computed(() => this.auth.hasRole('COLLECTION_MANAGER'));
  readonly isLeader = computed(() => this.auth.user()?.role === 'TEAM_LEADER');

  readonly tours = signal<Tour[]>([]);
  readonly leaders = signal<UserSummary[]>([]);
  readonly pending = signal<Harvest[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showCreate = signal(false);

  form = this.emptyForm();

  ngOnInit(): void {
    this.load();
    if (this.auth.hasRole('COLLECTION_MANAGER', 'TEAM_LEADER')) {
      this.lookup.teamLeaders().subscribe({ next: leaders => this.leaders.set(leaders), error: () => this.leaders.set([]) });
    }
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe({
      next: page => {
        const sorted = [...page.content].sort((a, b) => b.plannedDate.localeCompare(a.plannedDate));
        this.tours.set(sorted);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  leaderName(id: string): string {
    const user = this.auth.user();
    if (user && user.id === id) {
      return `${user.fullName} (vous)`;
    }
    return this.leaders().find(leader => leader.id === id)?.fullName ?? '—';
  }

  resourceType(type: string): string {
    return labelOf('resourceType', type).label;
  }

  canProgress(tour: Tour): boolean {
    const user = this.auth.user();
    return !!user && (user.role === 'ADMIN' || (user.role === 'TEAM_LEADER' && tour.teamLeaderId === user.id));
  }

  toggleCreate(): void {
    this.showCreate.set(!this.showCreate());
    if (!this.showCreate()) {
      return;
    }
    this.form = this.emptyForm();
    this.form.teamLeaderId = this.leaders()[0]?.id ?? '';
    this.harvestService.list({ status: 'REQUESTED', size: 100 }).subscribe(page => this.pending.set(page.content));
    if (!this.resources().length) {
      this.resourceService.list({ size: 100 }).subscribe(page =>
        this.resources.set(page.content.filter(resource => resource.status === 'AVAILABLE')));
    }
  }

  create(): void {
    this.saving.set(true);
    this.service.create({
      code: this.form.code.trim(),
      plannedDate: new Date(this.form.plannedDate).toISOString(),
      teamLeaderId: this.form.teamLeaderId,
      harvestIds: this.form.harvestIds,
      resourceIds: this.form.resourceIds,
      status: 'PLANNED'
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(`Tournée ${this.form.code} créée`);
        this.showCreate.set(false);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }

  progress(tour: Tour, status: Tour['status']): void {
    this.service.updateProgress(tour.id!, status).subscribe({
      next: () => {
        this.notify.success(status === 'IN_PROGRESS' ? `Tournée ${tour.code} démarrée` : `Tournée ${tour.code} terminée`);
        this.load();
      },
      error: error => this.notify.error(error)
    });
  }

  cancel(tour: Tour): void {
    this.confirm.ask({
      title: `Annuler la tournée ${tour.code} ?`,
      message: 'Les récoltes associées repasseront au statut « Demandée ».',
      confirmLabel: 'Annuler la tournée',
      danger: true
    }).subscribe(ok => {
      if (ok) {
        this.service.cancel(tour.id!).subscribe({
          next: () => {
            this.notify.success('Tournée annulée');
            this.load();
          },
          error: error => this.notify.error(error)
        });
      }
    });
  }

  private emptyForm() {
    const date = new Date(Date.now() + 86400000);
    date.setHours(7, 0, 0, 0);
    return {
      code: `T-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
      plannedDate: toLocalInput(date),
      teamLeaderId: '',
      harvestIds: [] as string[],
      resourceIds: [] as string[]
    };
  }
}
