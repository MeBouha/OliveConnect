import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-card class="auth-card">
      <mat-card-header><mat-card-title>Connexion OliveConnect</mat-card-title></mat-card-header>
      <mat-card-content>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Mot de passe</mat-label>
          <input matInput type="password" [(ngModel)]="password" />
        </mat-form-field>
        @if (error) { <p class="error">{{ error }}</p> }
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button color="primary" (click)="submit()">Se connecter</button>
        <a mat-button routerLink="/register">Créer un compte</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`.auth-card { max-width: 420px; margin: 40px auto; } mat-form-field { width: 100%; }`]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = 'farmer@oliveconnect.tn';
  password = 'Farmer@123';
  error = '';

  submit(): void {
    this.error = '';
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(returnUrl),
      error: () => (this.error = 'Identifiants invalides')
    });
  }
}
