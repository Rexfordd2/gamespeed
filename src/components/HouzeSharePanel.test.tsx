import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouzeSharePanel } from './HouzeSharePanel';
vi.mock('../lib/supabase', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'synthetic-test-token' } } }) } } }));
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status});
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('Houze sharing controls', () => {
  it('restores a saved link and pending deliveries after reload', async () => {
    fetchMock.mockResolvedValue(reply({ linked: true, pendingCount: 3 }));
    render(<HouzeSharePanel />);
    expect(await screen.findByText('3 rounds awaiting confirmed delivery.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Stop sharing new rounds'})).toBeEnabled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('does not redeem a code before explicit consent', async () => {
    fetchMock.mockResolvedValue(reply({ linked: false, pendingCount: 0 }));
    render(<HouzeSharePanel />);
    await screen.findByText('Sharing is off.');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'AHGS-test-code' } });
    expect(screen.getByRole('button', {name:'Share with Athlete Houze'})).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('stops new delivery without claiming old Houze records were removed', async () => {
    fetchMock.mockResolvedValueOnce(reply({ linked: true, pendingCount: 1 })).mockResolvedValueOnce(reply({ linked: false }));
    render(<HouzeSharePanel />);
    fireEvent.click(await screen.findByRole('button', {name: 'Stop sharing new rounds'}));
    await screen.findByText(/Previously shared records remain/);
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });
  it('retains the error state when a retry is refused', async () => {
    fetchMock.mockResolvedValueOnce(reply({ linked: true, pendingCount: 1 })).mockResolvedValueOnce(reply({},503));
    render(<HouzeSharePanel />);
    fireEvent.click(await screen.findByRole('button', {name:'Retry pending deliveries'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your saved games are retained');
    await waitFor(() => expect(screen.getByRole('button', {name:'Retry pending deliveries'})).toBeEnabled());
  });
  it('ignores a stale status response after an account panel is removed', async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>(r => { resolve = r; }));
    const first = render(<HouzeSharePanel />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    first.unmount();
    fetchMock.mockResolvedValueOnce(reply({ linked: false, pendingCount: 0 }));
    render(<HouzeSharePanel />);
    await screen.findByText('Sharing is off.');
    await act(async () => resolve(reply({ linked: true, pendingCount: 9 })));
    expect(screen.getByText('Sharing is off.')).toBeInTheDocument();
  });
});
