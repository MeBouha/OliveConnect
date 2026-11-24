import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

const API_MESSAGES: Record<string, string> = {
  'Daily press capacity exceeded': 'Capacité journalière du pressoir dépassée',
  'A receipt already exists for this harvest': 'Une réception existe déjà pour cette récolte',
  'Tour has already started': 'La tournée a déjà commencé',
  'Invalid email or password': 'Email ou mot de passe incorrect',
  'This orchard belongs to another farmer': 'Cette oliveraie appartient à un autre agriculteur',
  'This harvest belongs to another farmer': 'Cette récolte appartient à un autre agriculteur',
  'Only the assigned team leader can update this tour': "Seul le chef d'équipe assigné peut mettre à jour cette tournée",
  'Tour is already closed': 'La tournée est déjà clôturée',
  'Completed tour cannot be cancelled': 'Une tournée terminée ne peut pas être annulée',
  'A tour can contain at most 30 harvests': 'Une tournée contient au maximum 30 récoltes',
  'Only requested or validated harvests can be assigned to a tour': 'Seules les récoltes demandées ou validées peuvent être planifiées',
  'teamLeaderId must reference a TEAM_LEADER': "Le responsable choisi n'est pas chef d'équipe",
  'Self-registration is only allowed for FARMER': "L'inscription est réservée aux agriculteurs",
  'User account is disabled': 'Ce compte est désactivé'
};

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Serveur injoignable. Vérifiez votre connexion.';
    }
    if (error.status === 403) {
      return "Vous n'avez pas les droits pour cette action.";
    }
    const raw: string | undefined = error.error?.message;
    if (raw) {
      if (raw.startsWith('Tour code already exists')) {
        return 'Ce code de tournée existe déjà';
      }
      if (raw.startsWith('Email already registered')) {
        return 'Cette adresse email est déjà utilisée';
      }
      return API_MESSAGES[raw] ?? raw;
    }
    return `Erreur ${error.status}`;
  }
  return 'Une erreur inattendue est survenue.';
}

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000, panelClass: 'toast-success' });
  }

  error(error: unknown): void {
    const message = typeof error === 'string' ? error : apiErrorMessage(error);
    this.snackBar.open(message, 'Fermer', { duration: 6000, panelClass: 'toast-error' });
  }
}

export interface ConfirmData {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog">
      <div class="icon" [class.danger]="data.danger">
        <mat-icon>{{ data.danger ? 'warning' : 'help' }}</mat-icon>
      </div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="actions">
        <button mat-button [mat-dialog-close]="false">Annuler</button>
        <button mat-flat-button [class.danger-btn]="data.danger" [mat-dialog-close]="true" cdkFocusInitial>
          {{ data.confirmLabel ?? 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog { padding: 24px; max-width: 400px; }
    .icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--olive-100); color: var(--olive-700); margin-bottom: 16px; }
    .icon.danger { background: var(--danger-bg); color: var(--danger); }
    h2 { font-size: 18px; margin-bottom: 8px; }
    p { color: var(--ink-2); margin: 0 0 24px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .danger-btn { --mdc-filled-button-container-color: var(--danger); }
  `]
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  ask(data: ConfirmData): Observable<boolean | undefined> {
    return this.dialog.open(ConfirmDialogComponent, { data, autoFocus: 'dialog' }).afterClosed();
  }
}
