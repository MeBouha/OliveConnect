import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth.service';
import { ResourceDataService } from '../../core/domain.services';
import { Resource, SupplyView } from '../../core/models';
import { ConfirmService, NotifyService } from '../../shared/feedback';
import { labelOf, optionsOf, toLocalInput } from '../../shared/labels';
import { EmptyStateComponent, PageHeaderComponent, SkeletonRowsComponent, StatusComponent } from '../../shared/ui';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatTooltipModule, PageHeaderComponent, StatusComponent, EmptyStateComponent, SkeletonRowsComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Ressources" icon="inventory_2" subtitle="Équipes, tracteurs, caisses et stocks de la coopérative">
        @if (canEdit()) {
          <button mat-flat-button (click)="showCreate.set(!showCreate())">
            <mat-icon>{{ showCreate() ? 'close' : 'add' }}</mat-icon> {{ showCreate() ? 'Fermer' : 'Nouvelle ressource' }}
          </button>
        }
      </app-page-header>

      @if (supplies().length) {
        <section class="supplies">
          @for (supply of supplies(); track supply.type) {
            <article class="supply" [class.alert]="supply.reorderNeeded">
              <div class="supply-top">
                <span class="supply-icon"><mat-icon>{{ typeDef(supply.type).icon ?? 'inventory' }}</mat-icon></span>
                <span class="supply-name">{{ typeDef(supply.type).label }}</span>
                @if (supply.reorderNeeded) { <span class="chip danger">À réapprovisionner</span> }
              </div>
              <strong class="supply-value">{{ supply.stockLevel | number }}</strong>
              <div class="meter" [class.danger]="supply.reorderNeeded">
                <span [style.width.%]="stockPercent(supply)"></span>
              </div>
              <span class="supply-foot">Seuil de réapprovisionnement : {{ supply.reorderThreshold }}</span>
            </article>
          }
        </section>
      }

      @if (showCreate()) {
        <form class="card" (ngSubmit)="create()" #resourceForm="ngForm">
          <div class="card-header"><div class="card-title"><mat-icon>add_box</mat-icon> Nouvelle ressource</div></div>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Type</mat-label>
              <mat-select name="type" [(ngModel)]="form.type" required>
                @for (item of types; track item.value) { <mat-option [value]="item.value">{{ item.label }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Nom</mat-label>
              <input matInput name="name" [(ngModel)]="form.name" required placeholder="Tracteur 12" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Capacité</mat-label>
              <input matInput type="number" name="capacity" [(ngModel)]="form.capacity" required min="1" />
              <span matTextSuffix>{{ form.type === 'BIN' ? 'kg' : 'unité(s)' }}</span>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button type="button" (click)="showCreate.set(false)">Annuler</button>
            <button mat-flat-button type="submit" [disabled]="resourceForm.invalid || saving()"><mat-icon>check</mat-icon> Ajouter</button>
          </div>
        </form>
      }

      <section class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><mat-icon>event_available</mat-icon> Disponibilité</div>
            <div class="card-subtitle">Ressources libres sur une période donnée</div>
          </div>
          <span class="chip success plain avail">{{ available().length }} disponible(s)</span>
        </div>
        <form class="form-grid" (ngSubmit)="search()">
          <mat-form-field><mat-label>Du</mat-label><input matInput type="datetime-local" name="from" [(ngModel)]="from" required /></mat-form-field>
          <mat-form-field><mat-label>Au</mat-label><input matInput type="datetime-local" name="to" [(ngModel)]="to" required /></mat-form-field>
          <mat-form-field>
            <mat-label>Type</mat-label>
            <mat-select name="type" [(ngModel)]="searchType">
              <mat-option value="">Tous les types</mat-option>
              @for (item of types; track item.value) { <mat-option [value]="item.value">{{ item.label }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <div class="search-btn"><button mat-stroked-button type="submit"><mat-icon>search</mat-icon> Rechercher</button></div>
        </form>
        @if (available().length) {
          <div class="avail-list">
            @for (resource of available().slice(0, 24); track resource.id) {
              <span class="avail-item"><mat-icon>{{ typeDef(resource.type).icon }}</mat-icon>{{ resource.name }}</span>
            }
            @if (available().length > 24) { <span class="muted">+ {{ available().length - 24 }} autres</span> }
          </div>
        }
      </section>

      <section class="card flush">
        <div class="card-header">
          <div class="card-title"><mat-icon>list</mat-icon> Inventaire</div>
          <div class="type-filter">
            <button type="button" class="tab" [class.on]="!typeFilter()" (click)="typeFilter.set('')">Tous</button>
            @for (item of types; track item.value) {
              <button type="button" class="tab" [class.on]="typeFilter() === item.value" (click)="typeFilter.set(item.value)">{{ item.label }}</button>
            }
          </div>
        </div>
        @if (loading()) {
          <app-skeleton-rows [rows]="6" />
        } @else if (!filtered().length) {
          <app-empty icon="inventory_2" title="Aucune ressource" />
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Ressource</th><th>Type</th><th class="num">Capacité</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                @for (resource of shown(); track resource.id) {
                  <tr>
                    <td>
                      <div class="name-cell">
                        <span class="type-icon"><mat-icon>{{ typeDef(resource.type).icon }}</mat-icon></span>
                        <span class="cell-main">{{ resource.name }}</span>
                      </div>
                    </td>
                    <td class="muted">{{ typeDef(resource.type).label }}</td>
                    <td class="num">{{ resource.capacity | number }}{{ resource.type === 'BIN' ? ' kg' : '' }}</td>
                    <td><app-status kind="resourceStatus" [value]="resource.status" /></td>
                    <td class="actions">
                      @if (canEdit()) {
                        <button mat-icon-button matTooltip="Supprimer" (click)="remove(resource)" aria-label="Supprimer"><mat-icon>delete</mat-icon></button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (filtered().length > pageLimit) {
            <div class="more">
              <button mat-button (click)="expanded.set(!expanded())">
                <mat-icon>{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
                {{ expanded() ? 'Réduire' : 'Afficher tout (' + filtered().length + ')' }}
              </button>
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .supplies { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px; }
    .supply { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; }
    .supply.alert { border-color: #f0c4c0; background: linear-gradient(180deg, #fff 60%, var(--danger-bg)); }
    .supply-top { display: flex; align-items: center; gap: 8px; }
    .supply-icon { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--olive-100); color: var(--olive-700); }
    .supply-icon .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .supply-name { font-weight: 600; flex: 1; }
    .supply-value { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .supply-foot { font-size: 12px; color: var(--ink-3); }
    .search-btn { display: flex; align-items: flex-start; padding-top: 6px; }
    .avail { font-size: 13px; }
    .avail-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; align-items: center; }
    .avail-item { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--border); font-size: 12.5px; }
    .avail-item .mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--olive-600); }
    .type-filter { display: flex; gap: 4px; flex-wrap: wrap; }
    .tab { padding: 6px 12px; border-radius: 8px; border: 0; background: transparent; font: inherit; font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; }
    .tab:hover { background: var(--olive-50); color: var(--ink); }
    .tab.on { background: var(--olive-100); color: var(--olive-900); font-weight: 600; }
    .more { display: flex; justify-content: center; padding: 8px; border-top: 1px solid var(--border); }
    .name-cell { display: flex; align-items: center; gap: 10px; }
    .type-icon { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: var(--surface-2); border: 1px solid var(--border); color: var(--olive-600); }
    .type-icon .mat-icon { font-size: 17px; width: 17px; height: 17px; }
  `]
})
export class ResourcesComponent implements OnInit {
  private readonly service = inject(ResourceDataService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  readonly types = optionsOf('resourceType');
  readonly canEdit = computed(() => this.auth.hasRole('LOGISTICS_MANAGER'));
  readonly resources = signal<Resource[]>([]);
  readonly available = signal<Resource[]>([]);
  readonly supplies = signal<SupplyView[]>([]);
  readonly typeFilter = signal('');
  readonly filtered = computed(() => this.resources().filter(r => !this.typeFilter() || r.type === this.typeFilter()));
  readonly pageLimit = 15;
  readonly expanded = signal(false);
  readonly shown = computed(() => (this.expanded() ? this.filtered() : this.filtered().slice(0, this.pageLimit)));
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showCreate = signal(false);

  from = toLocalInput(new Date(Date.now() + 86400000));
  to = toLocalInput(new Date(Date.now() + 172800000));
  searchType = '';
  form = { type: 'BIN', name: '', capacity: 1000 };

  ngOnInit(): void {
    this.load();
    this.service.supplies().subscribe({ next: result => this.supplies.set(result), error: () => this.supplies.set([]) });
    this.search();
  }

  typeDef(type: string) {
    return labelOf('resourceType', type);
  }

  stockPercent(supply: SupplyView): number {
    const reference = Math.max(supply.reorderThreshold * 4, supply.stockLevel, 1);
    return Math.min((supply.stockLevel / reference) * 100, 100);
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe({
      next: page => {
        this.resources.set(page.content);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  search(): void {
    if (!this.from || !this.to) {
      return;
    }
    if (new Date(this.to) <= new Date(this.from)) {
      this.notify.error('La date de fin doit être après la date de début');
      return;
    }
    this.service.availability(new Date(this.from).toISOString(), new Date(this.to).toISOString(), this.searchType || undefined)
      .subscribe({ next: result => this.available.set(result), error: error => this.notify.error(error) });
  }

  create(): void {
    this.saving.set(true);
    this.service.create({ type: this.form.type, name: this.form.name.trim(), capacity: this.form.capacity, status: 'AVAILABLE' }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(`Ressource « ${this.form.name} » ajoutée`);
        this.form.name = '';
        this.showCreate.set(false);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }

  remove(resource: Resource): void {
    this.confirm.ask({
      title: 'Supprimer cette ressource ?',
      message: `« ${resource.name} » sera retirée de l'inventaire.`,
      confirmLabel: 'Supprimer',
      danger: true
    }).subscribe(ok => {
      if (ok) {
        this.service.delete(resource.id!).subscribe({
          next: () => {
            this.notify.success('Ressource supprimée');
            this.load();
          },
          error: error => this.notify.error(error)
        });
      }
    });
  }
}
