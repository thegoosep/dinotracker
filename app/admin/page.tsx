'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const ADMIN_USER_ID = '1194421789548351508';

interface Sub {
  discord_user_id: string;
  discord_username: string;
  paypal_subscription_id: string;
  guild_id: string;
  guild_name: string;
  status: string;
  plan_id: string;
  price: number;
  currency: string;
  created_at: string;
  activated_at: string | null;
  cancelled_at: string | null;
  expires_at: string | null;
  last_payment_at: string | null;
  paypal_payer_email: string;
  is_trial?: boolean;
}

const GlobalStyles = createGlobalStyle`
  body { margin: 0; background: #0a0a0f; color: #e5e7eb; }
`;

const Container = styled.div`
  min-height: 100vh;
  padding: 24px;
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const Badge = styled.span`
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 14px;
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: #d1d5db;
  vertical-align: middle;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  ${p => {
    switch (p.$status) {
      case 'active': return 'background: rgba(52,211,153,0.1); color: #34d399;';
      case 'cancelled': return 'background: rgba(245,158,11,0.1); color: #f59e0b;';
      case 'expired': return 'background: rgba(239,68,68,0.1); color: #ef4444;';
      case 'suspended': return 'background: rgba(239,68,68,0.1); color: #ef4444;';
      case 'pending': return 'background: rgba(96,165,250,0.1); color: #60a5fa;';
      default: return 'background: rgba(107,114,128,0.1); color: #6b7280;';
    }
  }}
`;

const TrialBadge = styled.span`
  background: rgba(167, 139, 250, 0.1);
  color: #a78bfa;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
`;

const ActionBtn = styled.button<{ $variant?: 'danger' | 'primary' }>`
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  ${p => p.$variant === 'danger'
    ? 'background: rgba(239,68,68,0.1); color: #ef4444;'
    : 'background: rgba(96,165,250,0.1); color: #60a5fa;'}

  &:hover {
    ${p => p.$variant === 'danger'
      ? 'background: rgba(239,68,68,0.2);'
      : 'background: rgba(96,165,250,0.2);'}
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const TimeInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #60a5fa;
  }
`;

const Message = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  font-size: 1rem;
`;

const Stats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 16px 20px;
  min-width: 120px;
`;

const StatValue = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
`;

const BackLink = styled.a`
  color: #6b7280;
  font-size: 0.8rem;
  text-decoration: none;
  &:hover { color: #9ca3af; }
`;

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}m`;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addTimeHours, setAddTimeHours] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSubs = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/subscriptions');
      if (r.status === 403) {
        setError('Access denied');
        setLoading(false);
        return;
      }
      if (!r.ok) throw new Error('Failed to load');
      const data = await r.json();
      setSubs(data.subscriptions || []);
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadSubs();
    else if (status === 'unauthenticated') setLoading(false);
  }, [status, loadSubs]);

  const handleAddTime = async (subId: string) => {
    const hours = parseFloat(addTimeHours[subId] || '');
    if (!hours || hours <= 0) return;

    setActionLoading(subId);
    try {
      const r = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypal_subscription_id: subId, add_hours: hours }),
      });
      if (r.ok) {
        setAddTimeHours(prev => ({ ...prev, [subId]: '' }));
        await loadSubs();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (subId: string, username: string) => {
    if (!confirm(`Remove subscription ${subId} for ${username}?`)) return;

    setActionLoading(subId);
    try {
      const r = await fetch('/api/admin/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypal_subscription_id: subId }),
      });
      if (r.ok) await loadSubs();
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <GlobalStyles />
        <Container><Message>Loading...</Message></Container>
      </>
    );
  }

  if (!session || session.user?.id !== ADMIN_USER_ID) {
    return (
      <>
        <GlobalStyles />
        <Container><Message>Access Denied</Message></Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalStyles />
        <Container><Message>{error}</Message></Container>
      </>
    );
  }

  const now = new Date().toISOString();
  const activeSubs = subs.filter(s => s.status === 'active' && (!s.expires_at || s.expires_at > now));
  const trialSubs = subs.filter(s => s.is_trial);
  const revenue = subs.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <>
      <GlobalStyles />
      <Container>
        <Content>
          <Header>
            <span style={{ fontSize: '1.8rem' }}>🦖</span>
            <Title>Admin Panel</Title>
            <Badge>Admin</Badge>
            <div style={{ flex: 1 }} />
            <BackLink href="/">Back to Dashboard</BackLink>
          </Header>

          <Stats>
            <StatCard>
              <StatValue>{subs.length}</StatValue>
              <StatLabel>Total Subs</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{activeSubs.length}</StatValue>
              <StatLabel>Active</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{trialSubs.length}</StatValue>
              <StatLabel>Trials</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>${revenue.toFixed(2)}</StatValue>
              <StatLabel>Revenue</StatLabel>
            </StatCard>
          </Stats>

          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Guild</Th>
                  <Th>Status</Th>
                  <Th>Plan</Th>
                  <Th>Price</Th>
                  <Th>Created</Th>
                  <Th>Expires</Th>
                  <Th>Time Left</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr>
                    <Td colSpan={9} style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                      No subscriptions found
                    </Td>
                  </tr>
                ) : (
                  subs.map(s => (
                    <tr key={s.paypal_subscription_id}>
                      <Td>
                        <div style={{ fontWeight: 600, color: 'white' }}>{s.discord_username || '—'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{s.discord_user_id}</div>
                      </Td>
                      <Td>
                        <div>{s.guild_name || '—'}</div>
                        {s.guild_id && <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{s.guild_id}</div>}
                      </Td>
                      <Td>
                        <StatusBadge $status={s.status}>{s.status}</StatusBadge>
                        {s.is_trial && <TrialBadge>Trial</TrialBadge>}
                      </Td>
                      <Td style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{s.plan_id || '—'}</Td>
                      <Td>{s.price > 0 ? `$${s.price.toFixed(2)}` : 'Free'}</Td>
                      <Td style={{ fontSize: '0.7rem' }}>{formatDate(s.created_at)}</Td>
                      <Td style={{ fontSize: '0.7rem' }}>{formatDate(s.expires_at)}</Td>
                      <Td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{timeRemaining(s.expires_at)}</Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TimeInput
                            type="number"
                            placeholder="hrs"
                            value={addTimeHours[s.paypal_subscription_id] || ''}
                            onChange={e => setAddTimeHours(prev => ({ ...prev, [s.paypal_subscription_id]: e.target.value }))}
                          />
                          <ActionBtn
                            onClick={() => handleAddTime(s.paypal_subscription_id)}
                            disabled={actionLoading === s.paypal_subscription_id || !addTimeHours[s.paypal_subscription_id]}
                          >
                            +Time
                          </ActionBtn>
                          <ActionBtn
                            $variant="danger"
                            onClick={() => handleDelete(s.paypal_subscription_id, s.discord_username)}
                            disabled={actionLoading === s.paypal_subscription_id}
                          >
                            Remove
                          </ActionBtn>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </Content>
      </Container>
    </>
  );
}
