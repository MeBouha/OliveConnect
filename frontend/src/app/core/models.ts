export type Role =
  | 'VISITOR'
  | 'FARMER'
  | 'COLLECTION_MANAGER'
  | 'TEAM_LEADER'
  | 'LOGISTICS_MANAGER'
  | 'PRESS_MANAGER'
  | 'ADMIN';

export interface AuthResponse {
  token: string;
  role: Role;
  userId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  phone?: string;
  role: Role;
}

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  active: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: number[];
}

export interface Orchard {
  id?: string;
  farmerId?: string;
  name: string;
  geometry: GeoJsonPoint;
  areaHa: number;
  variety: string;
  createdAt?: string;
}

export interface OrchardMapView {
  id: string;
  name: string;
  geometry: GeoJsonPoint;
  areaHa: number;
  variety: string;
  maturityLevel: number | null;
  harvestStatus: string | null;
}

export interface Harvest {
  id?: string;
  orchardId: string;
  farmerId?: string;
  type: 'PLANNED' | 'URGENT';
  status: 'REQUESTED' | 'VALIDATED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestedDate?: string;
  plannedDate?: string;
  actualHarvestDate?: string;
  quantityKg: number;
  notes?: string;
  tourId?: string;
}

export interface Alert {
  id?: string;
  orchardId: string;
  type: string;
  description: string;
  location?: GeoJsonPoint;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt?: string;
  resolvedAt?: string;
}

export interface Tour {
  id?: string;
  code: string;
  plannedDate: string;
  teamLeaderId: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  harvestIds: string[];
  resourceIds: string[];
}

export interface Resource {
  id?: string;
  type: string;
  name: string;
  capacity: number;
  availableFrom?: string;
  availableTo?: string;
  status: string;
}

export interface SupplyView {
  type: string;
  stockLevel: number;
  reorderThreshold: number;
  reorderNeeded: boolean;
}

export interface Press {
  id?: string;
  name: string;
  location: GeoJsonPoint;
  capacityKgPerDay: number;
  currentLoadKg: number;
  lastUpdated?: string;
}

export interface PressReceipt {
  harvestId: string;
  weightKg: number;
  qualityGrade: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStatus {
  uptimeSeconds: number;
  heapUsedMb: number;
  heapMaxMb: number;
  requestCount: number;
  mongoStatus: string;
}

export interface YieldKpi {
  orchardId: string;
  orchardName: string;
  harvestedKg: number;
  areaHa: number;
  yieldKgPerHa: number;
}

export interface WeeklyAlertKpi {
  week: string;
  count: number;
}

export interface DashboardKpis {
  yieldPerOrchard: YieldKpi[];
  averageCollectionDelayDays: number;
  totalHarvestedKg: number;
  totalReceivedKg: number;
  totalBinCapacityKg: number;
  binFillRate: number;
  alertsResolvedPerWeek: WeeklyAlertKpi[];
}

export interface UserSummary {
  id: string;
  fullName: string;
}
