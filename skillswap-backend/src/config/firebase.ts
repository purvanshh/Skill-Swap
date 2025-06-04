import admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      logger.info('🔥 Firebase Admin SDK initialized successfully');
    } else {
      logger.info('🔥 Firebase Admin SDK already initialized');
    }
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase immediately
initializeFirebase();

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();

// Configure Firestore settings for better performance
firestore.settings({
  ignoreUndefinedProperties: true,
});

// Helper function to verify Firebase ID token
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    logger.info(`✅ Token verified for user: ${decodedToken.uid}`);
    return decodedToken;
  } catch (error) {
    logger.error('❌ Firebase token verification failed:', error);
    throw new Error('Invalid Firebase token');
  }
}

// Helper function to create custom token
export async function createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
  try {
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    logger.info(`✅ Custom token created for user: ${uid}`);
    return customToken;
  } catch (error) {
    logger.error(`❌ Failed to create custom token for ${uid}:`, error);
    throw error;
  }
}

// Helper function to get user by UID
export async function getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
  try {
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    logger.error(`❌ Failed to get user ${uid}:`, error);
    throw error;
  }
}

// Test Firestore connection
export async function testFirestoreConnection(): Promise<void> {
  try {
    const testDoc = firestore.collection('_health_check').doc('connection_test');
    const testData = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'connected',
      service: 'skillswap-backend',
      version: '1.0.0'
    };

    await testDoc.set(testData);
    
    const doc = await testDoc.get();
    if (!doc.exists) {
      throw new Error('Firestore health check failed - document not found');
    }

    await testDoc.delete();
    logger.info('🔥 Firestore connection test passed');
  } catch (error) {
    logger.error('❌ Firestore connection test failed:', error);
    throw new Error(`Firestore connection failed: ${error}`);
  }
}

export default admin;
