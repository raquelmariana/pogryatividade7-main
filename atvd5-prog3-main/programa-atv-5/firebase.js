import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig, isFirebaseConfigurado } from './firebaseConfig';

let app;
let auth;
let analytics;

if (isFirebaseConfigurado()) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Analytics só funciona na web (Chrome)
  if (Platform.OS === 'web') {
    isSupported().then((ok) => {
      if (ok && app) {
        analytics = getAnalytics(app);
      }
    });
  }
}

export { auth, analytics, isFirebaseConfigurado };
