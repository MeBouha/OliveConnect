import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    title: 'Connexion',
    data: { bare: true },
    loadComponent: () => import('./features/auth/login.component').then(module => module.LoginComponent)
  },
  {
    path: 'register',
    title: 'Inscription',
    data: { bare: true },
    loadComponent: () => import('./features/auth/register.component').then(module => module.RegisterComponent)
  },
  {
    path: 'dashboard',
    title: 'Tableau de bord',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(module => module.DashboardComponent)
  },
  {
    path: 'map',
    title: 'Carte',
    loadComponent: () => import('./features/map/orchard-map.component').then(module => module.OrchardMapComponent)
  },
  {
    path: 'orchards',
    title: 'Oliveraies',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['FARMER', 'COLLECTION_MANAGER', 'TEAM_LEADER', 'LOGISTICS_MANAGER', 'PRESS_MANAGER', 'ADMIN'] },
    loadComponent: () => import('./features/orchards/orchards.component').then(module => module.OrchardsComponent)
  },
  {
    path: 'harvests',
    title: 'Récoltes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/harvests/harvests.component').then(module => module.HarvestsComponent)
  },
  {
    path: 'alerts',
    title: 'Alertes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/alerts/alerts.component').then(module => module.AlertsComponent)
  },
  {
    path: 'tours',
    title: 'Tournées',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tours/tours.component').then(module => module.ToursComponent)
  },
  {
    path: 'resources',
    title: 'Ressources',
    canActivate: [authGuard],
    loadComponent: () => import('./features/resources/resources.component').then(module => module.ResourcesComponent)
  },
  {
    path: 'presses',
    title: 'Pressoirs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/presses/presses.component').then(module => module.PressesComponent)
  },
  {
    path: 'notifications',
    title: 'Notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notifications.component').then(module => module.NotificationsComponent)
  },
  {
    path: 'admin',
    title: 'Administration',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./features/admin/admin.component').then(module => module.AdminComponent)
  },
  {
    path: 'help',
    title: 'Aide',
    loadComponent: () => import('./features/help/help.component').then(module => module.HelpComponent)
  },
  {
    path: 'forbidden',
    title: 'Accès refusé',
    loadComponent: () => import('./features/misc/forbidden.component').then(module => module.ForbiddenComponent)
  },
  {
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./features/misc/not-found.component').then(module => module.NotFoundComponent)
  }
];
