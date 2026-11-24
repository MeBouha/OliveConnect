import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth.service';
import { OrchardDataService } from '../../core/domain.services';
import { LookupService } from '../../core/lookup.service';
import { Orchard } from '../../core/models';
import { ConfirmService, NotifyService } from '../../shared/feedback';
import { EmptyStateComponent, PageHeaderComponent, SkeletonRowsComponent } from '../../shared/ui';

@Component({
  selector: 'app-orchards',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, SkeletonRowsComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Oliveraies" icon="park" [subtitle]="total() + ' oliveraies enregistrées'">
        @if (canEdit()) {
          <button mat-flat-button (click)="showForm.set(!showForm())">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon> {{ showForm() ? 'Fermer' : 'Nouvelle oliveraie' }}
          </button>
        }
      </app-page-header>

      @if (showForm()) {
        <form class="card" (ngSubmit)="create()" #orchardForm="ngForm">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>add_location_alt</mat-icon> Nouvelle oliveraie</div>
              <div class="card-subtitle">Coordonnées GPS en degrés décimaux (WGS 84)</div>
            </div>
          </div>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Nom</mat-label>
              <input matInput name="name" [(ngModel)]="form.name" required placeholder="Verger de la colline" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Variété</mat-label>
              <mat-select name="variety" [(ngModel)]="form.variety" required>
                @for (v of varieties; track v) { <mat-option [value]="v">{{ v }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Superficie</mat-label>
              <input matInput type="number" name="areaHa" [(ngModel)]="form.areaHa" required min="0.01" step="0.01" />
              <span matTextSuffix>ha</span>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Latitude</mat-label>
              <input matInput type="number" name="lat" [(ngModel)]="form.lat" required min="-90" max="90" step="0.0001" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Longitude</mat-label>
              <input matInput type="number" name="lng" [(ngModel)]="form.lng" required min="-180" max="180" step="0.0001" />
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button type="button" (click)="showForm.set(false)">Annuler</button>
            <button mat-flat-button type="submit" [disabled]="orchardForm.invalid || saving()">
              <mat-icon>check</mat-icon> Enregistrer
            </button>
          </div>
        </form>
      }

      <section class="card flush">
        @if (loading() && !orchards().length) {
          <app-skeleton-rows [rows]="8" />
        } @else if (!orchards().length) {
          <app-empty icon="park" title="Aucune oliveraie" hint="Ajoutez votre première oliveraie pour déclarer des récoltes." />
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Oliveraie</th><th>Variété</th><th class="num">Superficie</th><th>Position</th><th>Créée le</th><th></th></tr>
              </thead>
              <tbody>
                @for (orchard of orchards(); track orchard.id) {
                  <tr>
                    <td>
                      <div class="cell-main">{{ orchard.name }}</div>
                      <div class="cell-sub">{{ orchard.id }}</div>
                    </td>
                    <td><span class="chip olive plain">{{ orchard.variety }}</span></td>
                    <td class="num">{{ orchard.areaHa | number: '1.0-2' }} ha</td>
                    <td class="nowrap muted">{{ orchard.geometry.coordinates[1] | number: '1.3-3' }}, {{ orchard.geometry.coordinates[0] | number: '1.3-3' }}</td>
                    <td class="nowrap muted">{{ orchard.createdAt | date: 'd MMM y' }}</td>
                    <td class="actions">
                      @if (canEdit()) {
                        <button mat-icon-button matTooltip="Supprimer" (click)="remove(orchard)" aria-label="Supprimer">
                          <mat-icon>delete</mat-icon>
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
  `
})
export class OrchardsComponent implements OnInit {
  private readonly service = inject(OrchardDataService);
  private readonly lookup = inject(LookupService);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  private readonly auth = inject(AuthService);
  readonly canEdit = computed(() => this.auth.hasRole('FARMER'));
  readonly varieties = ['Chemlali', 'Chetoui', 'Zalmati', 'Oueslati'];
  readonly orchards = signal<Orchard[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  form = { name: '', variety: 'Chemlali', areaHa: 5, lat: 34.74, lng: 10.76 };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.list({ page: this.pageIndex(), size: this.pageSize() }).subscribe({
      next: page => {
        this.orchards.set(page.content);
        this.total.set(page.totalElements);
        this.lookup.remember(page.content);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  create(): void {
    this.saving.set(true);
    const body: Orchard = {
      name: this.form.name.trim(),
      variety: this.form.variety,
      areaHa: this.form.areaHa,
      geometry: { type: 'Point', coordinates: [this.form.lng, this.form.lat] }
    };
    this.service.create(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(`Oliveraie « ${body.name} » ajoutée`);
        this.form.name = '';
        this.showForm.set(false);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }

  remove(orchard: Orchard): void {
    this.confirm.ask({
      title: 'Supprimer cette oliveraie ?',
      message: `« ${orchard.name} » sera définitivement supprimée.`,
      confirmLabel: 'Supprimer',
      danger: true
    }).subscribe(ok => {
      if (ok) {
        this.service.delete(orchard.id!).subscribe({
          next: () => {
            this.notify.success('Oliveraie supprimée');
            this.load();
          },
          error: error => this.notify.error(error)
        });
      }
    });
  }
}
