import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('appends only defined query parameters', () => {
    service.get('/orchards', { page: 1, farmerId: null, size: 20 }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/orchards?page=1&size=20`);
    expect(request.request.method).toBe('GET');
    request.flush({ content: [] });
  });
});
