import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TestingAppointmentPicker, { testingDateKey } from '@/components/testing/TestingAppointmentPicker';

afterEach(cleanup);
const slots = [
  { id: 'a', startTime: '2026-12-02T15:00:00Z', endTime: '2026-12-02T16:00:00Z', location: 'Testing center', spotsRemaining: 2 },
  { id: 'b', startTime: '2027-01-05T15:00:00Z', endTime: '2027-01-05T16:00:00Z', location: null, spotsRemaining: 1 },
];
function Picker({ quantity = 1, appointments = slots, loading = false }) {
  const [value, onChange] = useState('');
  return <><TestingAppointmentPicker slots={appointments} quantity={quantity} value={value} onChange={onChange} loading={loading} /><output aria-label="Selected slot">{value}</output></>;
}
describe('testing appointment calendar', () => {
  it('uses the testing-center date across midnight and DST', () => {
    expect(testingDateKey('2026-12-02T02:00:00Z')).toBe('2026-12-01');
    expect(testingDateKey('2026-07-02T03:00:00Z')).toBe('2026-07-01');
  });
  it('offers only published days and passes the exact appointment ID', () => {
    render(<Picker />);
    expect(screen.getByRole('button', { name: 'December 2026 3, unavailable' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'December 2026 2, available' }));
    const select = screen.getByLabelText('Appointment time');
    expect(select).toHaveTextContent('10:00 AM Eastern Time');
    fireEvent.change(select, { target: { value: 'a' } });
    expect(screen.getByLabelText('Selected slot')).toHaveTextContent('a');
    fireEvent.click(screen.getByRole('button', { name: 'Next available month' }));
    fireEvent.click(screen.getByRole('button', { name: 'January 2027 5, available' }));
    expect(screen.getByLabelText('Selected slot')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Appointment time')).not.toHaveTextContent('December');
  });
  it('excludes appointments without enough group capacity', () => {
    render(<Picker quantity={2} />);
    expect(screen.getByRole('button', { name: 'Next available month' })).toBeDisabled();
  });
  it('shows a calendar and clear empty state without fabricating availability', () => {
    render(<Picker appointments={[]} />);
    expect(screen.getByText(/No published appointments/)).toBeVisible();
    expect(screen.queryByLabelText('Appointment time')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true);
  });
  it('shows loading without claiming there are no appointments', () => {
    render(<Picker appointments={[]} loading />);
    expect(screen.getByText('Loading available appointments…')).toHaveAttribute('role', 'status');
    expect(screen.queryByText(/No published/)).not.toBeInTheDocument();
  });
});
