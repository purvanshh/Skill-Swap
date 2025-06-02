import admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      logger.info('🔥 Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase
initializeFirebase();

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();

// Helper function to verify Firebase ID token
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('❌ Firebase token verification failed:', error);
    throw new Error('Invalid Firebase token');
  }
}

export default admin;