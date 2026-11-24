import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../shared/feedback';
import { AuthHeroComponent } from './auth-hero.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatProgressSpinnerModule, AuthHeroComponent
  ],
  styleUrl: './auth-layout.scss',
  template: `
    <div class="auth">
      <app-auth-hero />
      <section class="panel">
        <form class="form" (ngSubmit)="submit()" #registerForm="ngForm">
          <a class="back" routerLink="/login"><mat-icon>arrow_back</mat-icon> Connexion</a>
          <h1>Créer un compte</h1>
          <p class="lead">Inscription réservée aux agriculteurs membres. Les autres rôles sont attribués par un administrateur.</p>

          @if (error()) {
            <div class="banner error" role="alert"><mat-icon>error</mat-icon> {{ error() }}</div>
          }

          <mat-form-field>
            <mat-label>Nom complet</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput name="fullName" [(ngModel)]="fullName" required autocomplete="name" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>mail</mat-icon>
            <input matInput type="email" name="email" [(ngModel)]="email" required email autocomplete="email" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Téléphone</mat-label>
            <mat-icon matPrefix>call</mat-icon>
            <input matInput type="tel" name="phone" [(ngModel)]="phone" placeholder="+216 20 000 000" autocomplete="tel" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Mot de passe</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password"
                   required minlength="8" autocomplete="new-password" #pwd="ngModel" />
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>8 caractères minimum</mat-hint>
            @if (pwd.errors?.['minlength']) { <mat-error>Au moins 8 caractères</mat-error> }
          </mat-form-field>

          <button mat-flat-button class="submit" type="submit" [disabled]="loading() || registerForm.invalid">
            @if (loading()) { <mat-spinner diameter="20" /> } @else { Créer mon compte }
          </button>

          <p class="switch">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
        </form>
      </section>
    </div>
  `,
  styles: [`.submit mat-spinner { margin: 0 auto; --mdc-circular-progress-active-indicator-color: #fff; } mat-form-field + mat-form-field { margin-top: 4px; }`]
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  fullName = '';
  email = '';
  phone = '';
  password = '';

  submit(): void {
    if (this.loading()) {
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.auth.register({
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || undefined,
      password: this.password,
      role: 'FARMER'
    }).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: error => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error));
      }
    });
  }
}
