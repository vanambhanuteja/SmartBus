import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CrowdBadge from '../components/CrowdBadge.jsx';
import RouteList from '../components/RouteList.jsx';
import AuthForm from '../components/AuthForm.jsx';
import ReportForm from '../components/ReportForm.jsx';
import Home from '../pages/Home.jsx';
import { validateRegister } from '../validation.js';

const routes = [
  { id: 1, routeCode: 'SB-01', name: 'City Bus Stand - Chamundi Hill', stops: [{ id: 1 }, { id: 2 }] },
  { id: 2, routeCode: 'SB-02', name: 'Central - Hebbal', stops: [{ id: 3 }] },
];

describe('component rendering', () => {
  it('renders the home page headline and legend', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByText(/Know how crowded your bus is/i)).toBeInTheDocument();
    expect(screen.getByText(/Overcrowded/)).toBeInTheDocument();
  });

  it.each([['LOW', 'Low'], ['MODERATE', 'Moderate'], ['HIGH', 'High'], ['OVERCROWDED', 'Overcrowded']])(
    'shows the %s crowd badge with a text label', (key, label) => {
      render(<CrowdBadge level={key} percent={72.4} />);
      expect(screen.getByLabelText(`Crowd level ${label}`)).toHaveTextContent('72%');
    });
});

describe('route display', () => {
  it('lists routes with stop counts and reports selection', async () => {
    const onSelect = vi.fn();
    render(<RouteList routes={routes} selectedId={null} onSelect={onSelect} />);
    expect(screen.getByText('SB-01')).toBeInTheDocument();
    expect(screen.getByText(/2 stops/)).toBeInTheDocument();
    await userEvent.click(screen.getByText('SB-02'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('shows a message when there are no routes', () => {
    render(<RouteList routes={[]} onSelect={() => {}} />);
    expect(screen.getByText(/No routes available/)).toBeInTheDocument();
  });
});

describe('form validation', () => {
  it('validateRegister flags empty name, bad email and short password', () => {
    const e = validateRegister({ fullName: '', email: 'nope', password: '123' });
    expect(Object.keys(e).sort()).toEqual(['email', 'fullName', 'password']);
  });

  it('login form blocks submit and shows errors', async () => {
    const onSubmit = vi.fn();
    render(<AuthForm mode="login" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('login form submits valid values and shows server errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid email or password'));
    render(<AuthForm mode="login" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(onSubmit).toHaveBeenCalledWith({ fullName: '', email: 'a@b.com', password: 'secret123' });
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});

describe('crowd reporting interface', () => {
  it('requires a route and a level before submitting', async () => {
    const onSubmit = vi.fn();
    render(<ReportForm routes={routes} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(await screen.findByText('Please choose a route')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Route'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(await screen.findByText(/how crowded the bus is/i, { selector: 'p' })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the chosen route and level and confirms', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<ReportForm routes={routes} onSubmit={onSubmit} />);
    await userEvent.selectOptions(screen.getByLabelText('Route'), '2');
    await userEvent.click(screen.getByLabelText(/High/));
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ routeId: 2, crowdLevel: 'HIGH', note: null }));
    expect(await screen.findByText(/Thank you/)).toBeInTheDocument();
  });
});
