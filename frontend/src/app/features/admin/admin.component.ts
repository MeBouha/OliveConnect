import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth.service';
import { AdminDataService } from '../../core/domain.services';
import { AdminStatus, Role } from '../../core/models';
import { NotifyService } from '../../shared/feedback';
import { initials, labelOf, optionsOf } from '../../shared/labels';
import { PageHeaderComponent, SkeletonRowsComponent } from '../../shared/ui';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    PageHeaderComponent, SkeletonRowsComponent
  ],
  template: `
    <div class="page">
      <app-page-header title="Administration" icon="admin_panel_settings" subtitle="Supervision, imports de données et gestion des accès">
        <button mat-stroked-button (click)="loadStatus()"><mat-icon>refresh</mat-icon> Actualiser</button>
      </app-page-header>

      <section class="tiles">
        <article class="tile">
          <span class="label"><mat-icon>database</mat-icon> MongoDB</span>
          @if (status(); as s) {
            <span class="chip" [class.success]="s.mongoStatus === 'UP'" [class.danger]="s.mongoStatus !== 'UP'">{{ s.mongoStatus === 'UP' ? 'Opérationnel' : s.mongoStatus }}</span>
          } @else { <span class="skeleton line"></span> }
        </article>
        <article class="tile">
          <span class="label"><mat-icon>timer</mat-icon> Disponibilité</span>
          @if (status(); as s) { <strong>{{ uptime(s.uptimeSeconds) }}</strong> } @else { <span class="skeleton line"></span> }
        </article>
        <article class="tile">
          <span class="label"><mat-icon>memory</mat-icon> Mémoire JVM</span>
          @if (status(); as s) {
            <strong>{{ s.heapUsedMb | number: '1.0-0' }} <small>/ {{ s.heapMaxMb | number: '1.0-0' }} Mo</small></strong>
            <div class="meter" [class.warning]="heapPercent() > 75"><span [style.width.%]="heapPercent()"></span></div>
          } @else { <span class="skeleton line"></span> }
        </article>
        <article class="tile">
          <span class="label"><mat-icon>swap_vert</mat-icon> Requêtes traitées</span>
          @if (status(); as s) { <strong>{{ s.requestCount | number }}</strong> } @else { <span class="skeleton line"></span> }
        </article>
      </section>

      <div class="grid-2">
        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><mat-icon>cloud_download</mat-icon> Imports de données</div>
              <div class="card-subtitle">Exécutés automatiquement toutes les 10 minutes</div>
            </div>
          </div>
          <div class="sources">
            @for (src of sources; track src.value) {
              <label class="source" [class.on]="source === src.value">
                <input type="radio" name="source" [value]="src.value" [(ngModel)]="source" />
                <mat-icon>{{ src.icon }}</mat-icon>
                <div><strong>{{ src.label }}</strong><span>{{ src.hint }}</span></div>
              </label>
            }
          </div>
          <div class="form-actions">
            <button mat-flat-button (click)="trigger()" [disabled]="triggering()"><mat-icon>play_arrow</mat-icon> Lancer l'import</button>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div class="card-title"><mat-icon>groups</mat-icon> Répartition des rôles</div>
          </div>
          <div class="roles">
            @for (r of roleCounts(); track r.role) {
              <div class="role-row">
                <span class="chip" [class]="r.tone">{{ r.label }}</span>
                <div class="meter"><span [style.width.%]="r.percent"></span></div>
                <strong>{{ r.count }}</strong>
              </div>
            }
          </div>
        </section>
      </div>

      <section class="card flush">
        <div class="card-header">
          <div class="card-title"><mat-icon>manage_accounts</mat-icon> Utilisateurs</div>
          <mat-form-field class="search" subscriptSizing="dynamic">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Nom ou email…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </mat-form-field>
        </div>
        @if (!users().length) {
          <app-skeleton-rows [rows]="6" />
        } @else {
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th></tr></thead>
              <tbody>
                @for (user of filteredUsers(); track user.id) {
                  <tr>
                    <td>
                      <div class="user">
                        <span class="avatar">{{ initialsOf(user.fullName) }}</span>
                        <div>
                          <div class="cell-main">{{ user.fullName }} @if (user.id === me()?.id) { <span class="muted">(vous)</span> }</div>
                          <div class="cell-sub">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="role-cell">
                      <mat-form-field subscriptSizing="dynamic">
                        <mat-select [value]="user.role" (selectionChange)="updateRole(user, $event.value)" [disabled]="user.id === me()?.id"
                                    [attr.aria-label]="'Rôle de ' + user.fullName">
                          @for (role of roleOptions; track role.value) { <mat-option [value]="role.value">{{ role.label }}</mat-option> }
                        </mat-select>
                      </mat-form-field>
                    </td>
                    <td><span class="chip" [class.success]="user.active">{{ user.active ? 'Actif' : 'Désactivé' }}</span></td>
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
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 16px; }
    .tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; min-height: 110px; }
    .label { display: flex; align-items: center; gap: 6px; color: var(--ink-3); font-size: 13px; font-weight: 500; }
    .label .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tile strong { font-size: 22px; font-variant-numeric: tabular-nums; }
    .tile small { font-size: 13px; color: var(--ink-3); font-weight: 500; }
    .tile .chip { align-self: flex-start; }
    .line { height: 24px; width: 60%; }
    .sources { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .source { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; }
    .source.on { border-color: var(--olive-500); background: var(--olive-50); }
    .source input { accent-color: var(--olive-700); }
    .source .mat-icon { color: var(--olive-600); }
    .source div { display: flex; flex-direction: column; }
    .source span { font-size: 12px; color: var(--ink-3); }
    .roles { display: flex; flex-direction: column; gap: 10px; }
    .role-row { display: grid; grid-template-columns: 140px 1fr 32px; align-items: center; gap: 12px; }
    .role-row strong { text-align: right; font-variant-numeric: tabular-nums; }
    .search { width: min(100%, 300px); }
    .user { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--olive-100); color: var(--olive-800); font-size: 12px; font-weight: 700; flex: none; }
    .role-cell mat-form-field { width: 200px; }
  `]
})
export class AdminComponent implements OnInit {
  private readonly service = inject(AdminDataService);
  private readonly notify = inject(NotifyService);
  readonly me = inject(AuthService).user;

  readonly roleOptions = optionsOf('role');
  readonly sources = [
    { value: 'weather-json', label: 'Météo (JSON)', hint: 'Prévisions de pluie, déclenche les alertes météo', icon: 'rainy' },
    { value: 'maturity-sensor-csv', label: 'Capteurs de maturité (CSV)', hint: 'Relevés terrain des indices de maturité', icon: 'sensors' }
  ];
  readonly users = signal<AdminUser[]>([]);
  readonly status = signal<AdminStatus | null>(null);
  readonly query = signal('');
  readonly triggering = signal(false);
  readonly filteredUsers = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.users().filter(u => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });
  readonly heapPercent = computed(() => {
    const s = this.status();
    return s && s.heapMaxMb ? (s.heapUsedMb / s.heapMaxMb) * 100 : 0;
  });
  readonly roleCounts = computed(() => {
    const total = this.users().length || 1;
    return this.roleOptions
      .map(option => {
        const count = this.users().filter(u => u.role === option.value).length;
        return { role: option.value, label: option.label, tone: labelOf('role', option.value).tone, count, percent: (count / total) * 100 };
      })
      .filter(r => r.count > 0);
  });
  source = 'weather-json';

  ngOnInit(): void {
    this.service.users({ size: 100 }).subscribe({
      next: result => this.users.set(result.content as AdminUser[]),
      error: error => this.notify.error(error)
    });
    this.loadStatus();
  }

  loadStatus(): void {
    this.service.status().subscribe({ next: result => this.status.set(result), error: error => this.notify.error(error) });
  }

  initialsOf(name: string): string {
    return initials(name);
  }

  uptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d ? `${d} j ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
  }

  updateRole(user: AdminUser, role: Role): void {
    this.service.updateRole(user.id, role).subscribe({
      next: () => {
        this.users.update(list => list.map(u => (u.id === user.id ? { ...u, role } : u)));
        this.notify.success(`${user.fullName} est maintenant ${labelOf('role', role).label.toLowerCase()}`);
      },
      error: error => this.notify.error(error)
    });
  }

  trigger(): void {
    this.triggering.set(true);
    this.service.triggerImport(this.source).subscribe({
      next: () => {
        this.triggering.set(false);
        this.notify.success('Import déclenché — les données arriveront sous peu');
      },
      error: error => {
        this.triggering.set(false);
        this.notify.error(error);
      }
    });
  }
}
