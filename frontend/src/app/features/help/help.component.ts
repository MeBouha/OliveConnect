import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <h1 class="page-title">Aide</h1>
    <mat-card class="panel">
      <h3>Démarrage rapide</h3>
      <p>Connectez-vous avec un compte de démonstration, puis utilisez le menu pour explorer les oliveraies, les récoltes, les alertes et les tournées.</p>
      <h3>Rôles</h3>
      <ul>
        <li><strong>Agriculteur</strong> : oliveraies, demandes de récolte, alertes.</li>
        <li><strong>Responsable de collecte</strong> : planification des tournées et affectation des ressources.</li>
        <li><strong>Chef d'équipe</strong> : suivi de l'avancement des tournées.</li>
        <li><strong>Logistique</strong> : ressources et stocks.</li>
        <li><strong>Responsable pressoir</strong> : réceptions et capacités.</li>
        <li><strong>Administrateur</strong> : utilisateurs, imports et supervision.</li>
      </ul>
      <h3>Comptes de démonstration</h3>
      <p>admin&#64;oliveconnect.tn / Admin&#64;123 · farmer&#64;oliveconnect.tn / Farmer&#64;123 · manager&#64;oliveconnect.tn / Manager&#64;123</p>
    </mat-card>
  `
})
export class HelpComponent {}
