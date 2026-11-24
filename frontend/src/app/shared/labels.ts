import { Role } from '../core/models';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'olive';

export interface LabelDef {
  label: string;
  tone: Tone;
  icon?: string;
}

/** French labels and visual tone for every enum value the API returns. */
export const LABELS: Record<string, Record<string, LabelDef>> = {
  harvestStatus: {
    REQUESTED: { label: 'Demandée', tone: 'info' },
    VALIDATED: { label: 'Validée', tone: 'olive' },
    PLANNED: { label: 'Planifiée', tone: 'olive' },
    IN_PROGRESS: { label: 'En cours', tone: 'warning' },
    COMPLETED: { label: 'Terminée', tone: 'success' },
    CANCELLED: { label: 'Annulée', tone: 'neutral' }
  },
  harvestType: {
    PLANNED: { label: 'Normale', tone: 'neutral', icon: 'event' },
    URGENT: { label: 'Urgente', tone: 'danger', icon: 'priority_high' }
  },
  tourStatus: {
    PLANNED: { label: 'Planifiée', tone: 'info' },
    IN_PROGRESS: { label: 'En cours', tone: 'warning' },
    COMPLETED: { label: 'Terminée', tone: 'success' },
    CANCELLED: { label: 'Annulée', tone: 'neutral' }
  },
  alertStatus: {
    OPEN: { label: 'Ouverte', tone: 'danger' },
    ACKNOWLEDGED: { label: 'Prise en charge', tone: 'warning' },
    RESOLVED: { label: 'Résolue', tone: 'success' }
  },
  alertType: {
    MATURITY_OPTIMAL: { label: 'Maturité optimale', tone: 'olive', icon: 'eco' },
    RAIN: { label: 'Pluie', tone: 'info', icon: 'rainy' },
    PEST: { label: 'Ravageurs', tone: 'danger', icon: 'pest_control' },
    OTHER: { label: 'Autre', tone: 'neutral', icon: 'info' }
  },
  resourceType: {
    WORKER: { label: 'Ouvrier', tone: 'neutral', icon: 'engineering' },
    TRACTOR: { label: 'Tracteur', tone: 'neutral', icon: 'agriculture' },
    BIN: { label: 'Caisse / bac', tone: 'neutral', icon: 'inventory_2' },
    EQUIPMENT: { label: 'Équipement', tone: 'neutral', icon: 'handyman' }
  },
  resourceStatus: {
    AVAILABLE: { label: 'Disponible', tone: 'success' },
    BOOKED: { label: 'Réservée', tone: 'info' },
    MAINTENANCE: { label: 'Maintenance', tone: 'warning' }
  },
  role: {
    VISITOR: { label: 'Visiteur', tone: 'neutral', icon: 'visibility' },
    FARMER: { label: 'Agriculteur', tone: 'olive', icon: 'agriculture' },
    COLLECTION_MANAGER: { label: 'Resp. collecte', tone: 'info', icon: 'route' },
    TEAM_LEADER: { label: "Chef d'équipe", tone: 'warning', icon: 'groups' },
    LOGISTICS_MANAGER: { label: 'Logistique', tone: 'neutral', icon: 'local_shipping' },
    PRESS_MANAGER: { label: 'Resp. pressoir', tone: 'success', icon: 'factory' },
    ADMIN: { label: 'Administrateur', tone: 'danger', icon: 'admin_panel_settings' }
  },
  quality: {
    A: { label: 'Extra (A)', tone: 'success' },
    B: { label: 'Standard (B)', tone: 'olive' },
    C: { label: 'Lampante (C)', tone: 'warning' }
  }
};

export type LabelKind = keyof typeof LABELS;

export function labelOf(kind: string, value: string | null | undefined): LabelDef {
  if (!value) {
    return { label: '—', tone: 'neutral' };
  }
  return LABELS[kind]?.[value] ?? { label: value, tone: 'neutral' };
}

export function optionsOf(kind: string): { value: string; label: string; icon?: string }[] {
  return Object.entries(LABELS[kind] ?? {}).map(([value, def]) => ({ value, label: def.label, icon: def.icon }));
}

export function roleLabel(role: Role | null | undefined): string {
  return labelOf('role', role).label;
}

export function initials(name: string | null | undefined): string {
  return (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('');
}

/** Value for an <input type="datetime-local"> in the user's local time. */
export function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
