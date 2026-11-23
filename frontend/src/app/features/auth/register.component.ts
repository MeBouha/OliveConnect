import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card class="auth-card">
      <mat-card-header><mat-card-title>Créer un compte</mat-card-title></mat-card-header>
      <mat-card-content>
        <mat-form-field appearance="outline"><mat-label>Nom complet</mat-label><input matInput [(ngModel)]="fullName" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="email" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Téléphone</mat-label><input matInput [(ngModel)]="phone" /></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Mot de passe</mat-label>
          <input matInput type="password" [(ngModel)]="password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Rôle</mat-label>
          <mat-select [(ngModel)]="role">
            @for (item of roles; track item) { <mat-option [value]="item">{{ item }}</mat-option> }
          </mat-select>
        </mat-form-field>
        @if (error) { <p class="error">{{ error }}</p> }
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button color="primary" (click)="submit()">S'inscrire</button>
        <a mat-button routerLink="/login">Retour</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`.auth-card { max-width: 480px; margin: 40px auto; } mat-form-field { width: 100%; }`]
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly roles: Role[] = ['FARMER', 'COLLECTION_MANAGER', 'TEAM_LEADER', 'LOGISTICS_MANAGER', 'PRESS_MANAGER'];
  fullName = '';
  email = '';
  phone = '';
  password = '';
  role: Role = 'FARMER';
  error = '';

  submit(): void {
    this.auth.register({
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => (this.error = "Impossible de créer le compte")
    });
  }
}
