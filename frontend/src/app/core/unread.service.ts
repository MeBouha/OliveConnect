import { inject, Injectable, signal } from '@angular/core';
import { NotificationDataService } from './domain.services';

/** Unread notification count shown in the shell. */
@Injectable({ providedIn: 'root' })
export class UnreadService {
  private readonly notifications = inject(NotificationDataService);
  private readonly countState = signal(0);

  readonly count = this.countState.asReadonly();

  refresh(): void {
    this.notifications.list({ size: 100 }).subscribe({
      next: page => this.countState.set(page.content.filter(item => !item.read).length),
      error: () => this.countState.set(0)
    });
  }

  clear(): void {
    this.countState.set(0);
  }
}
