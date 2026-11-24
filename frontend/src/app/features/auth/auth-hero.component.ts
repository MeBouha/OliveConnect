import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Branded left-hand panel shared by the login and register screens. */
@Component({
  selector: 'app-auth-hero',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './auth-layout.scss',
  styles: [':host { display: contents !important; }'],
  template: `
  <div class="hero">
    <a class="logo" routerLink="/map">
      <img src="favicon.svg" alt="" width="40" height="40" />
      OliveConnect
    </a>
    <div>
      <h2>De l'oliveraie au pressoir, une récolte coordonnée.</h2>
      <p>Déclarez vos récoltes, planifiez les tournées, suivez la maturité et la charge des pressoirs de la coopérative de Sfax.</p>
    </div>
    <div class="stats">
      <div><strong>500</strong><span>oliveraies géolocalisées</span></div>
      <div><strong>2</strong><span>pressoirs partenaires</span></div>
      <div><strong>7</strong><span>rôles métier</span></div>
    </div>
    <svg class="branch" viewBox="0 0 200 200" aria-hidden="true">
      <path d="M20 180 C70 140 120 90 180 20" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" />
      <g fill="#fff">
        <ellipse cx="60" cy="140" rx="26" ry="10" transform="rotate(-50 60 140)" />
        <ellipse cx="85" cy="128" rx="26" ry="10" transform="rotate(-10 85 128)" />
        <ellipse cx="100" cy="95" rx="26" ry="10" transform="rotate(-60 100 95)" />
        <ellipse cx="128" cy="88" rx="26" ry="10" transform="rotate(-15 128 88)" />
        <ellipse cx="140" cy="55" rx="24" ry="9" transform="rotate(-65 140 55)" />
        <circle cx="112" cy="122" r="11" />
        <circle cx="150" cy="78" r="10" />
      </g>
    </svg>
  </div>
  `
})
export class AuthHeroComponent {}
