import * as admin from 'firebase-admin';

// Check if Firebase Admin is configured
const isConfigured =
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (isConfigured && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = isConfigured && admin.apps.length ? admin.firestore() : null;
export const adminAuth = isConfigured && admin.apps.length ? admin.auth() : null;
export default admin;
