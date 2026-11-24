import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  styleUrl: './status-page.scss',
  template: `
    <div class="status-page">
      <div class="badge"><mat-icon>explore_off</mat-icon></div>
      <span class="code">404</span>
      <h1>Page introuvable</h1>
      <p>Cette page n'existe pas ou a été déplacée.</p>
      <div class="actions">
        <a mat-flat-button routerLink="/dashboard"><mat-icon>space_dashboard</mat-icon> Tableau de bord</a>
        <a mat-stroked-button routerLink="/map"><mat-icon>map</mat-icon> Carte</a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
