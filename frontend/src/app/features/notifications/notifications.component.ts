import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { NotificationDataService } from '../../core/domain.services';
import { NotificationItem } from '../../core/models';
import { UnreadService } from '../../core/unread.service';
import { NotifyService } from '../../shared/feedback';
import { EmptyStateComponent, PageHeaderComponent, SkeletonRowsComponent } from '../../shared/ui';

function iconFor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('annul')) return 'cancel';
  if (t.includes('pressoir') || t.includes('réception')) return 'factory';
  if (t.includes('tournée')) return 'route';
  if (t.includes('alerte')) return 'notification_important';
  if (t.includes('récolte')) return 'shopping_basket';
  return 'notifications';
}

function relative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, SkeletonRowsComponent],
  template: `
    <div class="page narrow">
      <app-page-header title="Notifications" icon="notifications"
                       [subtitle]="unreadCount() ? unreadCount() + ' non lue(s)' : 'Tout est lu'">
        @if (unreadCount()) {
          <button mat-stroked-button (click)="markAll()"><mat-icon>done_all</mat-icon> Tout marquer comme lu</button>
        }
      </app-page-header>

      <section class="card flush">
        @if (loading()) {
          <app-skeleton-rows [rows]="5" />
        } @else if (!items().length) {
          <app-empty icon="notifications_off" title="Aucune notification" hint="Vous serez prévenu ici des récoltes, tournées et réceptions." />
        } @else {
          <ul class="list">
            @for (item of items(); track item.id) {
              <li class="item" [class.unread]="!item.read">
                <span class="icon"><mat-icon>{{ icon(item.title) }}</mat-icon></span>
                <div class="body">
                  <div class="top">
                    <strong>{{ item.title }}</strong>
                    <span class="time" [matTooltip]="(item.createdAt | date: 'd MMMM y, HH:mm') ?? ''">{{ when(item.createdAt) }}</span>
                  </div>
                  <p>{{ item.message }}</p>
                </div>
                @if (!item.read) {
                  <button mat-icon-button matTooltip="Marquer comme lu" (click)="markRead(item)" aria-label="Marquer comme lu">
                    <mat-icon>check</mat-icon>
                  </button>
                }
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
  styles: [`
    .narrow { max-width: 820px; }
    .list { list-style: none; margin: 0; padding: 0; }
    .item { display: flex; gap: 14px; align-items: flex-start; padding: 16px 20px; border-bottom: 1px solid var(--border); position: relative; }
    .item:last-child { border-bottom: 0; }
    .item.unread { background: var(--olive-50); }
    .item.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--gold-500); }
    .icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--surface-2); border: 1px solid var(--border); color: var(--olive-600); flex: none; }
    .icon .mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .body { flex: 1; min-width: 0; }
    .top { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
    .item:not(.unread) strong { font-weight: 500; }
    .time { font-size: 12px; color: var(--ink-3); white-space: nowrap; }
    p { margin: 2px 0 0; color: var(--ink-2); }
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly service = inject(NotificationDataService);
  private readonly unread = inject(UnreadService);
  private readonly notify = inject(NotifyService);

  readonly items = signal<NotificationItem[]>([]);
  readonly loading = signal(true);
  readonly unreadCount = computed(() => this.items().filter(item => !item.read).length);

  ngOnInit(): void {
    this.load();
  }

  icon(title: string): string {
    return iconFor(title);
  }

  when(iso: string): string {
    return relative(iso);
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe({
      next: page => {
        this.items.set([...page.content].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.loading.set(false);
        this.unread.refresh();
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  markRead(item: NotificationItem): void {
    this.service.markRead(item.id).subscribe({
      next: () => this.load(),
      error: error => this.notify.error(error)
    });
  }

  markAll(): void {
    const unread = this.items().filter(item => !item.read);
    forkJoin(unread.map(item => this.service.markRead(item.id))).subscribe({
      next: () => {
        this.notify.success('Toutes les notifications sont lues');
        this.load();
      },
      error: error => this.notify.error(error)
    });
  }
}
