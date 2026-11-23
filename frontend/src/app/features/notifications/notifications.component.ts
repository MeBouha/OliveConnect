import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NotificationDataService } from '../../core/domain.services';
import { NotificationItem } from '../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  template: `
    <h1 class="page-title">Notifications</h1>
    <mat-card class="panel">
      @for (item of items; track item.id) {
        <div class="notification">
          <div><strong>{{ item.title }}</strong> <span class="muted">{{ item.createdAt }}</span></div>
          <p>{{ item.message }}</p>
          @if (!item.read) { <button mat-button color="primary" (click)="markRead(item.id)">Marquer comme lu</button> }
        </div>
      } @empty { <p class="muted">Aucune notification</p> }
    </mat-card>
  `,
  styles: [`.notification { padding: 12px 0; border-bottom: 1px solid #e0e6e0; }`]
})
export class NotificationsComponent implements OnInit {
  private readonly service = inject(NotificationDataService);

  items: NotificationItem[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe(result => (this.items = result.content));
  }

  markRead(id: string): void {
    this.service.markRead(id).subscribe(() => this.load());
  }
}
