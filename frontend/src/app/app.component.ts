import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { Role } from './core/models';
import { UnreadService } from './core/unread.service';
import { initials, roleLabel } from './shared/labels';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: Role[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: 'Pilotage',
    items: [
      { path: '/dashboard', label: 'Tableau de bord', icon: 'space_dashboard' },
      { path: '/map', label: 'Carte', icon: 'map' }
    ]
  },
  {
    label: 'Production',
    items: [
      { path: '/orchards', label: 'Oliveraies', icon: 'park' },
      { path: '/harvests', label: 'Récoltes', icon: 'shopping_basket' },
      { path: '/alerts', label: 'Alertes', icon: 'notification_important' }
    ]
  },
  {
    label: 'Logistique',
    items: [
      { path: '/tours', label: 'Tournées', icon: 'route' },
      { path: '/resources', label: 'Ressources', icon: 'inventory_2' },
      { path: '/presses', label: 'Pressoirs', icon: 'factory' }
    ]
  },
  {
    label: 'Compte',
    items: [
      { path: '/notifications', label: 'Notifications', icon: 'notifications' },
      { path: '/admin', label: 'Administration', icon: 'admin_panel_settings', roles: ['ADMIN'] },
      { path: '/help', label: 'Aide', icon: 'help' }
    ]
  }
];

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatBadgeModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly unread = inject(UnreadService);

  readonly user = this.auth.user;
  readonly unreadCount = this.unread.count;
  readonly isDesktop = toSignal(
    inject(BreakpointObserver).observe('(min-width: 1024px)').pipe(map(state => state.matches)),
    { initialValue: true }
  );

  private readonly navEnd = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd)));

  /** Login/register render full-screen, without the app chrome. */
  readonly bare = computed(() => {
    this.navEnd();
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (route?.firstChild) {
      route = route.firstChild;
    }
    return !!route?.data['bare'];
  });

  readonly groups = computed(() => {
    const role = this.user()?.role;
    return NAV.map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || (!!role && item.roles.includes(role)))
    })).filter(group => group.items.length > 0);
  });

  readonly initials = computed(() => initials(this.user()?.fullName));
  readonly roleLabel = computed(() => roleLabel(this.user()?.role));

  constructor() {
    effect(() => {
      this.navEnd();
      if (this.user()) {
        this.unread.refresh();
      } else {
        this.unread.clear();
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
