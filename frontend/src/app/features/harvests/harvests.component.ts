import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth.service';
import { HarvestDataService, OrchardDataService, ResourceDataService } from '../../core/domain.services';
import { LookupService } from '../../core/lookup.service';
import { Harvest, Orchard, Resource, UserSummary } from '../../core/models';
import { ConfirmService, NotifyService } from '../../shared/feedback';
import { labelOf, toLocalInput } from '../../shared/labels';
import { EmptyStateComponent, PageHeaderComponent, SkeletonRowsComponent, StatusComponent } from '../../shared/ui';

const EDITABLE: Harvest['status'][] = ['REQUESTED', 'VALIDATED', 'PLANNED'];
const PLANNABLE: Harvest['status'][] = ['REQUESTED', 'VALIDATED'];

@Component({
  selector: 'app-harvests',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatPaginatorModule, MatTooltipModule,
    PageHeaderComponent, StatusComponent, EmptyStateComponent, SkeletonRowsComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Récoltes" icon="shopping_basket"
                       [subtitle]="isFarmer() ? 'Vos demandes de récolte et leur suivi' : 'Demandes des agriculteurs et planification'">
        @if (isFarmer()) {
          <button mat-flat-button (click)="toggleCreate()">
            <mat-icon>{{ showCreate() ? 'close' : 'add' }}</mat-icon> {{ showCreate() ? 'Fermer' : 'Demander une récolte' }}
          </button>
        }
      </app-page-header>

      @if (showCreate()) {
        <form class="card" (ngSubmit)="create()" #createForm="ngForm">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>add_task</mat-icon> Nouvelle demande de récolte</div>
              <div class="card-subtitle">Le responsable de collecte sera notifié automatiquement.</div>
            </div>
          </div>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Oliveraie</mat-label>
              <mat-select name="orchardId" [(ngModel)]="form.orchardId" required>
                @for (orchard of orchards(); track orchard.id) {
                  <mat-option [value]="orchard.id">{{ orchard.name }} · {{ orchard.variety }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Date souhaitée</mat-label>
              <input matInput type="datetime-local" name="requestedDate" [(ngModel)]="form.requestedDate" required />
            </mat-form-field>
            <div class="type-field">
              <span class="field-label">Priorité</span>
              <mat-button-toggle-group name="type" [(ngModel)]="form.type" hideSingleSelectionIndicator>
                <mat-button-toggle value="PLANNED"><mat-icon>event</mat-icon> Normale</mat-button-toggle>
                <mat-button-toggle value="URGENT"><mat-icon>priority_high</mat-icon> Urgente</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
            <mat-form-field class="span-all">
              <mat-label>Notes</mat-label>
              <textarea matInput name="notes" [(ngModel)]="form.notes" rows="2" placeholder="Accès, contraintes, volume estimé…"></textarea>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button type="button" (click)="showCreate.set(false)">Annuler</button>
            <button mat-flat-button type="submit" [disabled]="createForm.invalid || saving()"><mat-icon>send</mat-icon> Envoyer la demande</button>
          </div>
        </form>
      }

      @if (planning(); as harvest) {
        <form class="card plan" (ngSubmit)="assignTour()" #planForm="ngForm">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>route</mat-icon> Planifier une tournée</div>
              <div class="card-subtitle">
                {{ lookup.orchardName(harvest.orchardId) }} · demandée le {{ harvest.requestedDate | date: 'd MMM y' }}
                @if (harvest.notes) { · « {{ harvest.notes }} » }
              </div>
            </div>
            <button mat-icon-button type="button" (click)="planning.set(null)" aria-label="Fermer"><mat-icon>close</mat-icon></button>
          </div>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Code tournée</mat-label>
              <input matInput name="code" [(ngModel)]="plan.code" required />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Date et heure</mat-label>
              <input matInput type="datetime-local" name="plannedDate" [(ngModel)]="plan.plannedDate" required />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Chef d'équipe</mat-label>
              <mat-select name="teamLeaderId" [(ngModel)]="plan.teamLeaderId" required>
                @for (leader of leaders(); track leader.id) { <mat-option [value]="leader.id">{{ leader.fullName }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Ressources</mat-label>
              <mat-select name="resourceIds" [(ngModel)]="plan.resourceIds" multiple>
                @for (resource of resources(); track resource.id) {
                  <mat-option [value]="resource.id">{{ resource.name }} · {{ resourceType(resource.type) }}</mat-option>
                }
              </mat-select>
              <mat-hint>{{ plan.resourceIds.length }} sélectionnée(s)</mat-hint>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button type="button" (click)="planning.set(null)">Annuler</button>
            <button mat-flat-button type="submit" [disabled]="planForm.invalid || saving()"><mat-icon>check</mat-icon> Créer la tournée</button>
          </div>
        </form>
      }

      <section class="card flush">
        <div class="card-header">
          <div class="status-tabs" role="tablist" aria-label="Filtrer par statut">
            @for (tab of tabs; track tab.value) {
              <button type="button" role="tab" class="tab" [class.on]="status() === tab.value"
                      [attr.aria-selected]="status() === tab.value" (click)="setStatus(tab.value)">{{ tab.label }}</button>
            }
          </div>
        </div>

        @if (loading() && !harvests().length) {
          <app-skeleton-rows [rows]="6" />
        } @else if (!harvests().length) {
          <app-empty icon="shopping_basket" title="Aucune récolte" [hint]="status() ? 'Aucune récolte avec ce statut.' : 'Les demandes de récolte apparaîtront ici.'" />
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Oliveraie</th><th>Priorité</th><th>Statut</th><th>Demandée</th><th>Planifiée</th><th class="num">Quantité</th><th></th></tr>
              </thead>
              <tbody>
                @for (harvest of harvests(); track harvest.id) {
                  <tr>
                    <td>
                      <div class="cell-main">{{ lookup.orchardName(harvest.orchardId) }}</div>
                      @if (harvest.notes) { <div class="cell-sub notes">{{ harvest.notes }}</div> }
                    </td>
                    <td><app-status kind="harvestType" [value]="harvest.type" /></td>
                    <td><app-status kind="harvestStatus" [value]="harvest.status" /></td>
                    <td class="nowrap muted">{{ harvest.requestedDate | date: 'd MMM y' }}</td>
                    <td class="nowrap muted">{{ (harvest.plannedDate | date: 'd MMM, HH:mm') ?? '—' }}</td>
                    <td class="num">{{ harvest.quantityKg ? (harvest.quantityKg | number: '1.0-0') + ' kg' : '—' }}</td>
                    <td class="actions">
                      @if (isManager() && canPlan(harvest)) {
                        <button mat-stroked-button (click)="openPlan(harvest)"><mat-icon>route</mat-icon> Planifier</button>
                      }
                      @if (canCancel(harvest)) {
                        <button mat-icon-button matTooltip="Annuler la demande" (click)="cancel(harvest)" aria-label="Annuler">
                          <mat-icon>cancel</mat-icon>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <mat-paginator [length]="total()" [pageIndex]="pageIndex()" [pageSize]="pageSize()"
                         [pageSizeOptions]="[10, 20, 50, 100]" (page)="onPage($event)" />
        }
      </section>
    </div>
  `,
  styles: [`
    .status-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .tab {
      padding: 6px 12px; border-radius: 8px; border: 0; background: transparent; font: inherit; font-size: 13px;
      font-weight: 500; color: var(--ink-3); cursor: pointer;
    }
    .tab:hover { background: var(--olive-50); color: var(--ink); }
    .tab.on { background: var(--olive-100); color: var(--olive-900); font-weight: 600; }
    .type-field { display: flex; flex-direction: column; gap: 6px; padding-bottom: 16px; }
    .field-label { font-size: 12px; color: var(--ink-3); }
    mat-button-toggle-group { border-radius: 10px; }
    mat-button-toggle .mat-icon { font-size: 18px; width: 18px; height: 18px; vertical-align: -4px; margin-right: 4px; }
    .plan { border-color: var(--olive-300); box-shadow: 0 0 0 3px var(--olive-50); }
    .notes { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    td.actions button + button { margin-left: 4px; }
  `]
})
export class HarvestsComponent implements OnInit {
  private readonly service = inject(HarvestDataService);
  private readonly orchardService = inject(OrchardDataService);
  private readonly resourceService = inject(ResourceDataService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);
  readonly lookup = inject(LookupService);

  readonly tabs = [
    { value: '', label: 'Toutes' },
    { value: 'REQUESTED', label: 'Demandées' },
    { value: 'PLANNED', label: 'Planifiées' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminées' },
    { value: 'CANCELLED', label: 'Annulées' }
  ];

  readonly isFarmer = computed(() => this.auth.user()?.role === 'FARMER' || this.auth.user()?.role === 'ADMIN');
  readonly isManager = computed(() => this.auth.hasRole('COLLECTION_MANAGER'));

  readonly harvests = signal<Harvest[]>([]);
  readonly orchards = signal<Orchard[]>([]);
  readonly leaders = signal<UserSummary[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly status = signal('');
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showCreate = signal(false);
  readonly planning = signal<Harvest | null>(null);

  form = { orchardId: '', type: 'PLANNED', requestedDate: toLocalInput(new Date()), notes: '' };
  plan = { code: '', plannedDate: '', teamLeaderId: '', resourceIds: [] as string[] };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.list({ status: this.status(), page: this.pageIndex(), size: this.pageSize() }).subscribe({
      next: page => {
        this.harvests.set(page.content);
        this.total.set(page.totalElements);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  setStatus(value: string): void {
    this.status.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  resourceType(type: string): string {
    return labelOf('resourceType', type).label;
  }

  canPlan(harvest: Harvest): boolean {
    return PLANNABLE.includes(harvest.status) && !harvest.tourId;
  }

  canCancel(harvest: Harvest): boolean {
    if (!EDITABLE.includes(harvest.status)) {
      return false;
    }
    const user = this.auth.user();
    return this.isManager() || (!!user && harvest.farmerId === user.id);
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
    this.saving.set(true);
    this.service.create({
      orchardId: this.form.orchardId,
      type: this.form.type as Harvest['type'],
      requestedDate: new Date(this.form.requestedDate).toISOString(),
      quantityKg: 0,
      status: 'REQUESTED',
      notes: this.form.notes.trim()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Demande de récolte envoyée');
        this.form.notes = '';
        this.showCreate.set(false);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }

  openPlan(harvest: Harvest): void {
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(7, 0, 0, 0);
    const stamp = tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
    this.plan = {
      code: `T-${stamp}-${(harvest.id ?? '').slice(-4).toUpperCase()}`,
      plannedDate: toLocalInput(tomorrow),
      teamLeaderId: this.leaders()[0]?.id ?? '',
      resourceIds: []
    };
    this.planning.set(harvest);
    if (!this.leaders().length) {
      this.lookup.teamLeaders().subscribe({
        next: leaders => {
          this.leaders.set(leaders);
          this.plan.teamLeaderId ||= leaders[0]?.id ?? '';
        },
        error: error => this.notify.error(error)
      });
    }
    if (!this.resources().length) {
      this.resourceService.list({ size: 100 }).subscribe(page =>
        this.resources.set(page.content.filter(resource => resource.status === 'AVAILABLE')));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  assignTour(): void {
    const harvest = this.planning();
    if (!harvest) {
      return;
    }
    this.saving.set(true);
    this.service.assignTour(harvest.id!, {
      code: this.plan.code.trim(),
      plannedDate: new Date(this.plan.plannedDate).toISOString(),
      teamLeaderId: this.plan.teamLeaderId,
      resourceIds: this.plan.resourceIds
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(`Tournée ${this.plan.code} planifiée`);
        this.planning.set(null);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }

  cancel(harvest: Harvest): void {
    this.confirm.ask({
      title: 'Annuler cette récolte ?',
      message: `La demande pour « ${this.lookup.orchardName(harvest.orchardId)} » sera annulée et l'agriculteur notifié.`,
      confirmLabel: 'Annuler la récolte',
      danger: true
    }).subscribe(ok => {
      if (ok) {
        this.service.cancel(harvest.id!).subscribe({
          next: () => {
            this.notify.success('Récolte annulée');
            this.load();
          },
          error: error => this.notify.error(error)
        });
      }
    });
  }
}
