import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  styleUrl: './status-page.scss',
  template: `
    <div class="status-page">
      <div class="badge danger"><mat-icon>lock</mat-icon></div>
      <span class="code">403</span>
      <h1>Accès refusé</h1>
      <p>Votre rôle ne permet pas d'accéder à cette page. Contactez un administrateur si vous pensez que c'est une erreur.</p>
      <a mat-flat-button routerLink="/dashboard"><mat-icon>space_dashboard</mat-icon> Retour au tableau de bord</a>
    </div>
  `
})
export class ForbiddenComponent {}
