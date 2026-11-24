import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './feedback';
import { initials, labelOf, optionsOf } from './labels';

describe('labels', () => {
  it('translates known enum values with a tone', () => {
    expect(labelOf('harvestStatus', 'IN_PROGRESS')).toEqual({ label: 'En cours', tone: 'warning' });
    expect(labelOf('role', 'TEAM_LEADER').label).toBe("Chef d'équipe");
  });

  it('falls back to the raw value or a dash', () => {
    expect(labelOf('harvestStatus', 'SOMETHING_NEW').label).toBe('SOMETHING_NEW');
    expect(labelOf('harvestStatus', null).label).toBe('—');
  });

  it('lists options for selects', () => {
    expect(optionsOf('resourceType').map(option => option.value)).toEqual(['WORKER', 'TRACTOR', 'BIN', 'EQUIPMENT']);
  });

  it('builds initials from a full name', () => {
    expect(initials('Amina Trabelsi')).toBe('AT');
    expect(initials('')).toBe('');
  });
});

describe('apiErrorMessage', () => {
  it('translates known API messages to French', () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'Daily press capacity exceeded' } });
    expect(apiErrorMessage(error)).toBe('Capacité journalière du pressoir dépassée');
  });

  it('explains network and permission failures', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('injoignable');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 403 }))).toContain('droits');
  });
});
