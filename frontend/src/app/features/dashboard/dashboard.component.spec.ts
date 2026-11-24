import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideCharts(withDefaultRegisterables())]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('loads KPIs from the aggregation endpoint', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const request = http.expectOne(candidate => candidate.url.endsWith('/dashboard/kpis'));
    request.flush({
      yieldPerOrchard: [{ orchardId: 'o1', orchardName: 'O1', harvestedKg: 100, areaHa: 10, yieldKgPerHa: 10 }],
      averageCollectionDelayDays: 2,
      totalHarvestedKg: 100,
      totalReceivedKg: 50,
      totalBinCapacityKg: 200,
      binFillRate: 0.25,
      alertsResolvedPerWeek: [{ week: '2026-W01', count: 3 }]
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.kpis?.totalHarvestedKg).toBe(100);
    expect(fixture.componentInstance.yieldData.labels).toEqual(['O1']);
    http.verify();
  });
});
