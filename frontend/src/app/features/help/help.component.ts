import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [MatIconModule, RouterLink, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header title="Aide" icon="help" subtitle="Prise en main d'OliveConnect" />

      <section class="card">
        <div class="card-header"><div class="card-title"><mat-icon>rocket_launch</mat-icon> Démarrage rapide</div></div>
        <ol class="steps">
          <li><span>1</span><div><strong>Connectez-vous</strong><p>Utilisez un compte de démonstration depuis la <a routerLink="/login">page de connexion</a> (un clic suffit).</p></div></li>
          <li><span>2</span><div><strong>Explorez la carte</strong><p>Repérez les oliveraies prêtes à récolter, colorées selon leur maturité.</p></div></li>
          <li><span>3</span><div><strong>Suivez le cycle</strong><p>Demande de récolte → tournée planifiée → collecte → réception au pressoir.</p></div></li>
        </ol>
      </section>

      <section>
        <h2 class="section-title">Rôles</h2>
        <div class="roles">
          @for (role of roles; track role.name) {
            <article class="role card">
              <span class="role-icon"><mat-icon>{{ role.icon }}</mat-icon></span>
              <div>
                <strong>{{ role.name }}</strong>
                <p>{{ role.desc }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="card flush">
        <div class="card-header"><div class="card-title"><mat-icon>key</mat-icon> Comptes de démonstration</div></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Rôle</th><th>Email</th><th>Mot de passe</th></tr></thead>
            <tbody>
              @for (account of accounts; track account.email) {
                <tr><td>{{ account.role }}</td><td><code>{{ account.email }}</code></td><td><code>{{ account.password }}</code></td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
    .steps li { display: flex; gap: 12px; }
    .steps span { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--olive-700); color: #fff; font-weight: 700; font-size: 13px; flex: none; }
    .steps p { margin: 2px 0 0; color: var(--ink-2); }
    .section-title { font-size: 16px; margin-bottom: 12px; }
    .roles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 12px; }
    .role { display: flex; gap: 14px; align-items: flex-start; padding: 16px; }
    .role-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--olive-100); color: var(--olive-700); flex: none; }
    .role p { margin: 2px 0 0; color: var(--ink-2); font-size: 13px; }
    code { font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; background: var(--surface-2); border: 1px solid var(--border); padding: 2px 6px; border-radius: 6px; }
  `]
})
export class HelpComponent {
  readonly roles = [
    { name: 'Agriculteur', icon: 'agriculture', desc: 'Enregistre ses oliveraies, demande des récoltes et signale des alertes.' },
    { name: 'Responsable de collecte', icon: 'route', desc: 'Planifie les tournées et affecte équipes et ressources.' },
    { name: "Chef d'équipe", icon: 'groups', desc: "Démarre et clôture les tournées qui lui sont assignées sur le terrain." },
    { name: 'Logistique', icon: 'local_shipping', desc: 'Gère tracteurs, caisses, équipements et niveaux de stock.' },
    { name: 'Responsable pressoir', icon: 'factory', desc: 'Enregistre les réceptions et ajuste la capacité journalière.' },
    { name: 'Administrateur', icon: 'admin_panel_settings', desc: 'Gère les utilisateurs, les imports de données et la supervision.' }
  ];

  readonly accounts = [
    { role: 'Agriculteur', email: 'farmer@oliveconnect.tn', password: 'Farmer@123' },
    { role: 'Responsable de collecte', email: 'manager@oliveconnect.tn', password: 'Manager@123' },
    { role: "Chef d'équipe", email: 'leader@oliveconnect.tn', password: 'Leader@123' },
    { role: 'Logistique', email: 'logistics@oliveconnect.tn', password: 'Logistics@123' },
    { role: 'Responsable pressoir', email: 'press@oliveconnect.tn', password: 'Press@123' },
    { role: 'Administrateur', email: 'admin@oliveconnect.tn', password: 'Admin@123' }
  ];
}
