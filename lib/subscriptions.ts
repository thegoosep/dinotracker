import { adminDb } from '@/lib/firebaseAdmin';
import * as fs from 'fs';
import * as path from 'path';

const COLLECTION = 'subscriptions';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'subscriptions.json');

export interface Subscription {
  discord_user_id: string;
  discord_username: string;
  paypal_subscription_id: string;
  guild_id: string;
  guild_name: string;
  status: 'active' | 'cancelled' | 'suspended' | 'expired' | 'pending';
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

// --- Local JSON fallback ---
// Keyed by paypal_subscription_id

function loadLocalSubs(): Record<string, Subscription> {
  try {
    if (fs.existsSync(LOCAL_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('[Subscriptions] Failed to load local subs:', e);
  }
  return {};
}

function saveLocalSubs(subs: Record<string, Subscription>) {
  const dir = path.dirname(LOCAL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_PATH, JSON.stringify(subs, null, 2), 'utf-8');
}

// --- CRUD functions ---

/** Get all subscriptions for a user */
export async function getSubscriptionsForUser(discordUserId: string): Promise<Subscription[]> {
  if (adminDb) {
    const snap = await adminDb
      .collection(COLLECTION)
      .where('discord_user_id', '==', discordUserId)
      .get();
    return snap.docs.map(d => d.data() as Subscription);
  }
  const subs = loadLocalSubs();
  return Object.values(subs).filter(s => s.discord_user_id === discordUserId);
}

/** Get a single subscription (first one found for user — legacy compat) */
export async function getSubscription(discordUserId: string): Promise<Subscription | null> {
  const all = await getSubscriptionsForUser(discordUserId);
  return all[0] || null;
}

/** Find the newest subscription for a user that has no guild assigned yet */
export async function getPendingGuildSubscription(discordUserId: string): Promise<Subscription | null> {
  const all = await getSubscriptionsForUser(discordUserId);
  return all.find(s => (s.status === 'active' || s.status === 'pending') && !s.guild_id) || null;
}

export async function getSubscriptionByPayPalId(paypalSubscriptionId: string): Promise<Subscription | null> {
  if (adminDb) {
    const doc = await adminDb.collection(COLLECTION).doc(paypalSubscriptionId).get();
    return doc.exists ? (doc.data() as Subscription) : null;
  }
  const subs = loadLocalSubs();
  return subs[paypalSubscriptionId] || null;
}

/** Check if a user has already used their free trial */
export async function hasUsedTrial(discordUserId: string): Promise<boolean> {
  const all = await getSubscriptionsForUser(discordUserId);
  return all.some(s => s.is_trial === true);
}

function isSubActive(s: Subscription, now: string): boolean {
  if (s.status === 'active') {
    // Trials and other subs with expires_at: check expiry
    if (s.expires_at && s.expires_at <= now) return false;
    return true;
  }
  if (s.status === 'cancelled' && s.expires_at && s.expires_at > now) {
    return true;
  }
  return false;
}

export async function getActiveSubscriptions(): Promise<Subscription[]> {
  const now = new Date().toISOString();

  if (adminDb) {
    const snap = await adminDb
      .collection(COLLECTION)
      .where('status', 'in', ['active', 'cancelled'])
      .get();
    return snap.docs
      .map(d => d.data() as Subscription)
      .filter(s => isSubActive(s, now));
  }

  const subs = loadLocalSubs();
  return Object.values(subs).filter(s => isSubActive(s, now));
}

export async function isGuildSubscriptionActive(guildId: string): Promise<boolean> {
  const active = await getActiveSubscriptions();
  return active.some(s => s.guild_id === guildId);
}

export async function createSubscription(sub: Subscription): Promise<void> {
  if (adminDb) {
    await adminDb.collection(COLLECTION).doc(sub.paypal_subscription_id).set(sub);
  } else {
    const subs = loadLocalSubs();
    subs[sub.paypal_subscription_id] = sub;
    saveLocalSubs(subs);
  }
}

export async function updateSubscriptionByPayPalId(
  paypalSubscriptionId: string,
  updates: Partial<Subscription>
): Promise<void> {
  if (adminDb) {
    await adminDb.collection(COLLECTION).doc(paypalSubscriptionId).update(updates);
  } else {
    const subs = loadLocalSubs();
    if (subs[paypalSubscriptionId]) {
      subs[paypalSubscriptionId] = { ...subs[paypalSubscriptionId], ...updates };
      saveLocalSubs(subs);
    }
  }
}

/** Get every subscription (admin use) */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  if (adminDb) {
    const snap = await adminDb.collection(COLLECTION).get();
    return snap.docs.map(d => d.data() as Subscription);
  }
  const subs = loadLocalSubs();
  return Object.values(subs);
}

/** Delete a subscription by PayPal ID */
export async function deleteSubscription(paypalSubscriptionId: string): Promise<void> {
  if (adminDb) {
    await adminDb.collection(COLLECTION).doc(paypalSubscriptionId).delete();
  } else {
    const subs = loadLocalSubs();
    delete subs[paypalSubscriptionId];
    saveLocalSubs(subs);
  }
}
