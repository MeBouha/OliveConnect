import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { HarvestDataService, PressDataService } from '../../core/domain.services';
import { LookupService } from '../../core/lookup.service';
import { Harvest, Press } from '../../core/models';
import { NotifyService } from '../../shared/feedback';
import { optionsOf } from '../../shared/labels';
import { EmptyStateComponent, PageHeaderComponent } from '../../shared/ui';

interface ReceiptDraft {
  harvestId: string;
  weightKg: number;
  qualityGrade: string;
}

@Component({
  selector: 'app-presses',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Pressoirs" icon="factory" subtitle="Charge journalière et réception des olives" />

      @if (!loading() && !presses().length) {
        <div class="card"><app-empty icon="factory" title="Aucun pressoir" /></div>
      }

      <div class="grid-2">
        @for (press of presses(); track press.id) {
          <article class="card press">
            <div class="press-head">
              <div class="press-icon"><mat-icon>factory</mat-icon></div>
              <div class="grow">
                <h2>{{ press.name }}</h2>
                <span class="muted small">Mis à jour {{ (press.lastUpdated | date: 'd MMM, HH:mm') ?? '—' }}</span>
              </div>
              <span class="chip" [class]="loadTone(press)">{{ loadPercent(press) | number: '1.0-0' }} %</span>
            </div>

            <div class="load">
              <div class="load-numbers">
                <strong>{{ press.currentLoadKg | number: '1.0-0' }} kg</strong>
                <span class="muted">sur {{ press.capacityKgPerDay | number: '1.0-0' }} kg / jour</span>
              </div>
              <div class="meter big" [class]="loadTone(press)"><span [style.width.%]="loadPercent(press)"></span></div>
              <span class="muted small">Reste {{ remaining(press) | number: '1.0-0' }} kg disponibles aujourd'hui</span>
            </div>

            @if (canEdit()) {
              <div class="section">
                <h3><mat-icon>tune</mat-icon> Capacité journalière</h3>
                <form class="inline" (ngSubmit)="updateCapacity(press)">
                  <mat-form-field>
                    <mat-label>Capacité</mat-label>
                    <input matInput type="number" [name]="'cap-' + press.id" [(ngModel)]="capacity[press.id!]" min="1" required />
                    <span matTextSuffix>kg/j</span>
                  </mat-form-field>
                  <button mat-stroked-button type="submit" [disabled]="capacity[press.id!] === press.capacityKgPerDay">Mettre à jour</button>
                </form>
              </div>

              <div class="section">
                <h3><mat-icon>scale</mat-icon> Nouvelle réception</h3>
                <form (ngSubmit)="createReceipt(press)" #receiptForm="ngForm">
                  <div class="form-grid">
                    <mat-form-field class="span-all">
                      <mat-label>Récolte livrée</mat-label>
                      <mat-select [name]="'harvest-' + press.id" [(ngModel)]="receipt[press.id!].harvestId" required>
                        @for (harvest of deliverable(); track harvest.id) {
                          <mat-option [value]="harvest.id">
                            {{ lookup.orchardName(harvest.orchardId) }} · {{ harvest.plannedDate | date: 'd MMM' }}
                          </mat-option>
                        } @empty {
                          <mat-option disabled>Aucune récolte en attente de réception</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Poids</mat-label>
                      <input matInput type="number" [name]="'weight-' + press.id" [(ngModel)]="receipt[press.id!].weightKg" min="1" required />
                      <span matTextSuffix>kg</span>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Qualité</mat-label>
                      <mat-select [name]="'grade-' + press.id" [(ngModel)]="receipt[press.id!].qualityGrade" required>
                        @for (grade of grades; track grade.value) { <mat-option [value]="grade.value">{{ grade.label }}</mat-option> }
                      </mat-select>
                    </mat-form-field>
                  </div>
                  @if (receipt[press.id!].weightKg > remaining(press)) {
                    <p class="warn"><mat-icon>warning</mat-icon> Ce poids dépasse la capacité restante du jour.</p>
                  }
                  <div class="form-actions">
                    <button mat-flat-button type="submit" [disabled]="receiptForm.invalid || saving()"><mat-icon>check</mat-icon> Enregistrer la réception</button>
                  </div>
                </form>
              </div>
            }
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    .press { display: flex; flex-direction: column; gap: 20px; }
    .press-head { display: flex; align-items: center; gap: 12px; }
    .press-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--gold-100); color: var(--gold-600); flex: none; }
    .grow { flex: 1; min-width: 0; }
    h2 { font-size: 17px; }
    .small { font-size: 12px; }
    .load { display: flex; flex-direction: column; gap: 8px; }
    .load-numbers { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
    .load-numbers strong { font-size: 22px; font-variant-numeric: tabular-nums; }
    .meter.big { height: 12px; }
    .section { border-top: 1px solid var(--border); padding-top: 16px; }
    h3 { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ink-2); margin-bottom: 12px; }
    h3 .mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--olive-600); }
    .inline { display: flex; gap: 12px; align-items: flex-start; }
    .inline mat-form-field { flex: 1; }
    .inline button { margin-top: 8px; }
    .warn { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; color: var(--warning); font-size: 13px; }
    .warn .mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class PressesComponent implements OnInit {
  private readonly service = inject(PressDataService);
  private readonly harvestService = inject(HarvestDataService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  readonly lookup = inject(LookupService);

  readonly grades = optionsOf('quality');
  readonly canEdit = computed(() => this.auth.hasRole('PRESS_MANAGER'));
  readonly presses = signal<Press[]>([]);
  readonly deliverable = signal<Harvest[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  capacity: Record<string, number> = {};
  receipt: Record<string, ReceiptDraft> = {};

  ngOnInit(): void {
    this.loadPresses();
    this.loadDeliverable();
  }

  loadPresses(): void {
    this.service.list().subscribe({
      next: result => {
        this.presses.set(result);
        result.forEach(press => {
          this.capacity[press.id!] = press.capacityKgPerDay;
          this.receipt[press.id!] ??= { harvestId: '', weightKg: 500, qualityGrade: 'A' };
        });
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  /** Harvests that are on their way to a press (planned or in progress). */
  loadDeliverable(): void {
    forkJoin([
      this.harvestService.list({ status: 'IN_PROGRESS', size: 100 }),
      this.harvestService.list({ status: 'PLANNED', size: 100 })
    ]).subscribe({
      next: ([inProgress, planned]) => this.deliverable.set([...inProgress.content, ...planned.content]),
      error: () => this.deliverable.set([])
    });
  }

  loadPercent(press: Press): number {
    return press.capacityKgPerDay ? Math.min((press.currentLoadKg / press.capacityKgPerDay) * 100, 100) : 0;
  }

  loadTone(press: Press): string {
    const percent = this.loadPercent(press);
    return percent >= 90 ? 'danger' : percent >= 70 ? 'warning' : 'success';
  }

  remaining(press: Press): number {
    return Math.max(press.capacityKgPerDay - press.currentLoadKg, 0);
  }

  updateCapacity(press: Press): void {
    this.service.updateCapacity(press.id!, this.capacity[press.id!]).subscribe({
      next: () => {
        this.notify.success(`Capacité de ${press.name} mise à jour`);
        this.loadPresses();
      },
      error: error => this.notify.error(error)
    });
  }

  createReceipt(press: Press): void {
    const draft = this.receipt[press.id!];
    this.saving.set(true);
    this.service.createReceipt(press.id!, { ...draft }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(`Réception de ${draft.weightKg} kg enregistrée`);
        draft.harvestId = '';
        this.loadPresses();
        this.loadDeliverable();
      },
      error: error => {
        this.saving.set(false);
        this.notify.error(error);
      }
    });
  }
}
