import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PressDataService } from '../../core/domain.services';
import { Press } from '../../core/models';

@Component({
  selector: 'app-presses',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h1 class="page-title">Pressoirs</h1>
    @for (press of presses; track press.id) {
      <mat-card class="panel">
        <h3>{{ press.name }}</h3>
        <p>Charge : {{ press.currentLoadKg }} kg / {{ press.capacityKgPerDay }} kg</p>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Nouvelle capacité</mat-label><input matInput type="number" [(ngModel)]="capacity[press.id!]" /></mat-form-field>
          <button mat-button color="primary" (click)="updateCapacity(press.id!)">Mettre à jour</button>
        </div>
        <h4>Nouvelle réception</h4>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>ID récolte</mat-label><input matInput [(ngModel)]="receipt[press.id!].harvestId" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Poids (kg)</mat-label><input matInput type="number" [(ngModel)]="receipt[press.id!].weightKg" /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Qualité</mat-label>
            <mat-select [(ngModel)]="receipt[press.id!].qualityGrade">
              <mat-option value="A">A</mat-option><mat-option value="B">B</mat-option><mat-option value="C">C</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="createReceipt(press.id!)">Enregistrer</button>
        </div>
      </mat-card>
    }
  `,
  styles: [`.form-grid { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`]
})
export class PressesComponent implements OnInit {
  private readonly service = inject(PressDataService);

  presses: Press[] = [];
  capacity: Record<string, number> = {};
  receipt: Record<string, { harvestId: string; weightKg: number; qualityGrade: string }> = {};

  ngOnInit(): void {
    this.service.list().subscribe(result => {
      this.presses = result;
      result.forEach(press => {
        this.capacity[press.id!] = press.capacityKgPerDay;
        this.receipt[press.id!] = { harvestId: '', weightKg: 100, qualityGrade: 'A' };
      });
    });
  }

  updateCapacity(id: string): void {
    this.service.updateCapacity(id, this.capacity[id]).subscribe();
  }

  createReceipt(id: string): void {
    const value = this.receipt[id];
    this.service.createReceipt(id, {
      harvestId: value.harvestId,
      weightKg: value.weightKg,
      qualityGrade: value.qualityGrade
    }).subscribe(() => {
      value.harvestId = '';
    });
  }
}
