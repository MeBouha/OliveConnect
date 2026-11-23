import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RouterLink],
  template: `
    <mat-card class="panel">
      <h1>Accès refusé</h1>
      <p>Votre rôle ne permet pas d'accéder à cette page.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">Retour au tableau de bord</a>
    </mat-card>
  `
})
export class ForbiddenComponent {}
