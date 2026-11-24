import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { labelOf } from './labels';

/** Page title block with optional icon, subtitle and projected actions. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <header class="page-header">
      @if (icon()) {
        <div class="icon"><mat-icon>{{ icon() }}</mat-icon></div>
      }
      <div class="text">
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .icon {
      width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center;
      background: var(--olive-100); color: var(--olive-700); flex: none;
    }
    .text { flex: 1 1 240px; min-width: 0; }
    h1 { font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.2; }
    p { margin: 4px 0 0; color: var(--ink-3); }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  `]
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
}

/** Coloured pill for an enum value, e.g. <app-status kind="harvestStatus" [value]="h.status" />. */
@Component({
  selector: 'app-status',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <span class="chip" [class]="def().tone" [class.plain]="!!def().icon">
      @if (def().icon) { <mat-icon>{{ def().icon }}</mat-icon> }
      {{ def().label }}
    </span>
  `,
  styles: [`.chip .mat-icon { font-size: 15px; width: 15px; height: 15px; }`]
})
export class StatusComponent {
  readonly kind = input.required<string>();
  readonly value = input<string | null | undefined>();
  readonly def = computed(() => labelOf(this.kind(), this.value()));
}

/** Friendly placeholder for empty lists. */
@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <div class="icon"><mat-icon>{{ icon() }}</mat-icon></div>
      <strong>{{ title() }}</strong>
      @if (hint()) { <p>{{ hint() }}</p> }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty { text-align: center; padding: 40px 20px; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .icon { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--olive-50); color: var(--olive-500); }
    strong { color: var(--ink-2); font-size: 15px; }
    p { margin: 0; max-width: 360px; }
  `]
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly hint = input('');
}

/** Placeholder rows while a table loads. */
@Component({
  selector: 'app-skeleton-rows',
  standalone: true,
  template: `
    <div class="rows">
      @for (row of rowsArray(); track $index) { <div class="skeleton"></div> }
    </div>
  `,
  styles: [`.rows { display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; } .skeleton { height: 36px; }`]
})
export class SkeletonRowsComponent {
  readonly rows = input(5);
  readonly rowsArray = computed(() => Array.from({ length: this.rows() }));
}
