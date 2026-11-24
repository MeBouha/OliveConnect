import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Role } from '../../core/models';
import { apiErrorMessage } from '../../shared/feedback';
import { labelOf } from '../../shared/labels';
import { AuthHeroComponent } from './auth-hero.component';

interface DemoAccount {
  role: Role;
  email: string;
  password: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'FARMER', email: 'farmer@oliveconnect.tn', password: 'Farmer@123' },
  { role: 'COLLECTION_MANAGER', email: 'manager@oliveconnect.tn', password: 'Manager@123' },
  { role: 'TEAM_LEADER', email: 'leader@oliveconnect.tn', password: 'Leader@123' },
  { role: 'LOGISTICS_MANAGER', email: 'logistics@oliveconnect.tn', password: 'Logistics@123' },
  { role: 'PRESS_MANAGER', email: 'press@oliveconnect.tn', password: 'Press@123' },
  { role: 'ADMIN', email: 'admin@oliveconnect.tn', password: 'Admin@123' }
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, AuthHeroComponent
  ],
  styleUrl: './auth-layout.scss',
  template: `
    <div class="auth">
      <app-auth-hero />
      <section class="panel">
        <form class="form" (ngSubmit)="submit()" #loginForm="ngForm">
          <a class="back" routerLink="/map"><mat-icon>arrow_back</mat-icon> Carte publique</a>
          <h1>Bon retour</h1>
          <p class="lead">Connectez-vous à votre espace coopérative.</p>

          @if (expired) {
            <div class="banner info"><mat-icon>schedule</mat-icon> Votre session a expiré. Reconnectez-vous.</div>
          }
          @if (error()) {
            <div class="banner error" role="alert"><mat-icon>error</mat-icon> {{ error() }}</div>
          }

          <mat-form-field>
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>mail</mat-icon>
            <input matInput type="email" name="email" [(ngModel)]="email" required email autocomplete="username" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Mot de passe</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password" required autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <button mat-flat-button class="submit" type="submit" [disabled]="loading() || loginForm.invalid">
            @if (loading()) { <mat-spinner diameter="20" /> } @else { Se connecter }
          </button>

          <div class="demo">
            <div class="demo-title"><mat-icon>bolt</mat-icon> Comptes de démonstration</div>
            <div class="demo-grid">
              @for (account of demoAccounts; track account.email) {
                <button type="button" class="demo-account" (click)="useDemo(account)" [matTooltip]="account.email">
                  <mat-icon>{{ roleIcon(account.role) }}</mat-icon>
                  {{ roleName(account.role) }}
                </button>
              }
            </div>
          </div>

          <p class="switch">Agriculteur sans compte ? <a routerLink="/register">Créer un compte</a></p>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .submit mat-spinner { margin: 0 auto; --mdc-circular-progress-active-indicator-color: #fff; }
    .demo { margin-top: 28px; padding-top: 20px; border-top: 1px dashed var(--border-strong); }
    .demo-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); margin-bottom: 12px; }
    .demo-title .mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--gold-500); }
    .demo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
    .demo-account {
      display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px;
      border: 1px solid var(--border); background: var(--surface-2); color: var(--ink-2);
      font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; text-align: left;
      transition: border-color 0.15s, background 0.15s;
    }
    .demo-account:hover { border-color: var(--olive-300); background: var(--olive-50); color: var(--ink); }
    .demo-account .mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--olive-600); }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly demoAccounts = DEMO_ACCOUNTS;
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  email = '';
  password = '';

  roleName(role: Role): string {
    return labelOf('role', role).label;
  }

  roleIcon(role: Role): string {
    return labelOf('role', role).icon ?? 'person';
  }

  useDemo(account: DemoAccount): void {
    this.email = account.email;
    this.password = account.password;
    this.submit();
  }

  submit(): void {
    if (!this.email || !this.password || this.loading()) {
      return;
    }
    this.error.set('');
    this.loading.set(true);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(returnUrl),
      error: error => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error));
      }
    });
  }
}
