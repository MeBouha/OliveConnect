import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RouterLink],
  template: `
    <mat-card class="panel">
      <h1>Page introuvable</h1>
      <a mat-flat-button color="primary" routerLink="/dashboard">Tableau de bord</a>
    </mat-card>
  `
})
export class NotFoundComponent {}
