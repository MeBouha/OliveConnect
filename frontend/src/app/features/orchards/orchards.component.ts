import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrchardDataService } from '../../core/domain.services';
import { Orchard } from '../../core/models';

@Component({
  selector: 'app-orchards',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <h1 class="page-title">Oliveraies</h1>
    <mat-card class="panel">
      <h3>Nouvelle oliveraie</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Nom</mat-label><input matInput [(ngModel)]="form.name" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Variété</mat-label><input matInput [(ngModel)]="form.variety" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Superficie (ha)</mat-label><input matInput type="number" [(ngModel)]="form.areaHa" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Longitude</mat-label><input matInput type="number" [(ngModel)]="form.lng" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Latitude</mat-label><input matInput type="number" [(ngModel)]="form.lat" /></mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="create()">Ajouter</button>
    </mat-card>
    <mat-card class="panel">
      <table>
        <thead><tr><th>Nom</th><th>Variété</th><th>Superficie</th><th>Agriculteur</th><th></th></tr></thead>
        <tbody>
          @for (orchard of orchards; track orchard.id) {
            <tr>
              <td>{{ orchard.name }}</td>
              <td>{{ orchard.variety }}</td>
              <td>{{ orchard.areaHa }} ha</td>
              <td>{{ orchard.farmerId }}</td>
              <td><button mat-button color="warn" (click)="remove(orchard.id!)">Supprimer</button></td>
            </tr>
          } @empty { <tr><td colspan="5" class="muted">Aucune oliveraie</td></tr> }
        </tbody>
      </table>
    </mat-card>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }`]
})
export class OrchardsComponent implements OnInit {
  private readonly service = inject(OrchardDataService);

  orchards: Orchard[] = [];
  form = { name: '', variety: 'Chemlali', areaHa: 12, lng: 10.8, lat: 35.2 };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe(result => (this.orchards = result.content));
  }

  create(): void {
    const body: Orchard = {
      name: this.form.name,
      variety: this.form.variety,
      areaHa: this.form.areaHa,
      geometry: { type: 'Point', coordinates: [this.form.lng, this.form.lat] }
    };
    this.service.create(body).subscribe(() => {
      this.form.name = '';
      this.load();
    });
  }

  remove(id: string): void {
    this.service.delete(id).subscribe(() => this.load());
  }
}
