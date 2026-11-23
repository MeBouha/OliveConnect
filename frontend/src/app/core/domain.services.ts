import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from './api.service';
import {
  AdminStatus,
  Alert,
  DashboardKpis,
  Harvest,
  NotificationItem,
  Orchard,
  OrchardMapView,
  PageResponse,
  Press,
  PressReceipt,
  Resource,
  SupplyView,
  Tour
} from './models';

@Injectable({ providedIn: 'root' })
export class OrchardDataService {
  private readonly api = inject(ApiService);

  map(bbox = '10.0,34.2,11.5,35.1'): Observable<OrchardMapView[]> {
    return this.api.get<OrchardMapView[]>('/orchards/map', { bbox });
  }

  list(params: QueryParams = {}): Observable<PageResponse<Orchard>> {
    return this.api.get<PageResponse<Orchard>>('/orchards', params);
  }

  get(id: string): Observable<Orchard> {
    return this.api.get<Orchard>(`/orchards/${id}`);
  }

  create(body: Orchard): Observable<Orchard> {
    return this.api.post<Orchard>('/orchards', body);
  }

  update(id: string, body: Orchard): Observable<Orchard> {
    return this.api.put<Orchard>(`/orchards/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/orchards/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class HarvestDataService {
  private readonly api = inject(ApiService);

  list(params: QueryParams = {}): Observable<PageResponse<Harvest>> {
    return this.api.get<PageResponse<Harvest>>('/harvests', params);
  }

  get(id: string): Observable<Harvest> {
    return this.api.get<Harvest>(`/harvests/${id}`);
  }

  create(body: Harvest): Observable<Harvest> {
    return this.api.post<Harvest>('/harvests', body);
  }

  update(id: string, body: Harvest): Observable<Harvest> {
    return this.api.put<Harvest>(`/harvests/${id}`, body);
  }

  cancel(id: string): Observable<Harvest> {
    return this.api.post<Harvest>(`/harvests/${id}/cancel`, {});
  }

  assignTour(id: string, body: unknown): Observable<Tour> {
    return this.api.post<Tour>(`/harvests/${id}/assign-tour`, body);
  }
}

@Injectable({ providedIn: 'root' })
export class AlertDataService {
  private readonly api = inject(ApiService);

  list(params: QueryParams = {}): Observable<PageResponse<Alert>> {
    return this.api.get<PageResponse<Alert>>('/alerts', params);
  }

  create(body: Alert): Observable<Alert> {
    return this.api.post<Alert>('/alerts', body);
  }

  updateStatus(id: string, status: string): Observable<Alert> {
    return this.api.patch<Alert>(`/alerts/${id}/status`, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class TourDataService {
  private readonly api = inject(ApiService);

  list(params: QueryParams = {}): Observable<PageResponse<Tour>> {
    return this.api.get<PageResponse<Tour>>('/tours', params);
  }

  get(id: string): Observable<Tour> {
    return this.api.get<Tour>(`/tours/${id}`);
  }

  create(body: Tour): Observable<Tour> {
    return this.api.post<Tour>('/tours', body);
  }

  updateProgress(id: string, status: string, notes = ''): Observable<Tour> {
    return this.api.patch<Tour>(`/tours/${id}/progress`, { status, notes });
  }

  cancel(id: string): Observable<Tour> {
    return this.api.post<Tour>(`/tours/${id}/cancel`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class ResourceDataService {
  private readonly api = inject(ApiService);

  list(params: QueryParams = {}): Observable<PageResponse<Resource>> {
    return this.api.get<PageResponse<Resource>>('/resources', params);
  }

  availability(from: string, to: string, type?: string): Observable<Resource[]> {
    return this.api.get<Resource[]>('/resources/availability', { from, to, type });
  }

  supplies(): Observable<SupplyView[]> {
    return this.api.get<SupplyView[]>('/resources/supplies');
  }

  create(body: Resource): Observable<Resource> {
    return this.api.post<Resource>('/resources', body);
  }

  update(id: string, body: Resource): Observable<Resource> {
    return this.api.put<Resource>(`/resources/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/resources/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PressDataService {
  private readonly api = inject(ApiService);

  list(): Observable<Press[]> {
    return this.api.get<Press[]>('/presses');
  }

  createReceipt(id: string, body: PressReceipt): Observable<PressReceipt> {
    return this.api.post<PressReceipt>(`/presses/${id}/receipts`, body);
  }

  updateCapacity(id: string, capacityKgPerDay: number): Observable<Press> {
    return this.api.patch<Press>(`/presses/${id}/capacity`, { capacityKgPerDay });
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationDataService {
  private readonly api = inject(ApiService);

  list(params: QueryParams = {}): Observable<PageResponse<NotificationItem>> {
    return this.api.get<PageResponse<NotificationItem>>('/notifications', params);
  }

  markRead(id: string): Observable<NotificationItem> {
    return this.api.patch<NotificationItem>(`/notifications/${id}/read`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly api = inject(ApiService);

  users(params: QueryParams = {}): Observable<PageResponse<unknown>> {
    return this.api.get<PageResponse<unknown>>('/admin/users', params);
  }

  updateRole(id: string, role: string): Observable<unknown> {
    return this.api.patch<unknown>(`/admin/users/${id}/role`, { role });
  }

  triggerImport(source: string): Observable<void> {
    return this.api.post<void>('/admin/imports/trigger', { source });
  }

  status(): Observable<AdminStatus> {
    return this.api.get<AdminStatus>('/admin/status');
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly api = inject(ApiService);

  kpis(params: QueryParams = {}): Observable<DashboardKpis> {
    return this.api.get<DashboardKpis>('/dashboard/kpis', params);
  }
}
