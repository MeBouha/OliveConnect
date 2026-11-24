import { inject, Injectable, signal } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import { OrchardDataService } from './domain.services';
import { Orchard, UserSummary } from './models';

/** Resolves IDs shown in tables to human-readable names, with caching. */
@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly api = inject(ApiService);
  private readonly orchards = inject(OrchardDataService);
  private readonly orchardNames = signal<Record<string, string>>({});
  private readonly pending = new Set<string>();
  private teamLeaders$?: Observable<UserSummary[]>;

  remember(orchards: Orchard[]): void {
    const known: Record<string, string> = {};
    orchards.forEach(orchard => orchard.id && (known[orchard.id] = orchard.name));
    this.orchardNames.update(current => ({ ...current, ...known }));
  }

  /** Orchard name, fetched lazily on first use; returns the id meanwhile. */
  orchardName(id: string | null | undefined): string {
    if (!id) {
      return '—';
    }
    const name = this.orchardNames()[id];
    if (name) {
      return name;
    }
    if (!this.pending.has(id)) {
      this.pending.add(id);
      this.orchards.get(id).subscribe({
        next: orchard => this.orchardNames.update(current => ({ ...current, [id]: orchard.name })),
        error: () => this.orchardNames.update(current => ({ ...current, [id]: id }))
      });
    }
    return '…';
  }

  teamLeaders(): Observable<UserSummary[]> {
    this.teamLeaders$ ??= this.api.get<UserSummary[]>('/users/team-leaders').pipe(shareReplay(1));
    return this.teamLeaders$;
  }
}
