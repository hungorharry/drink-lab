import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { safeStorage } from "@/utils/safeStorage";

// Firebase configuration from environment variables (.env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured with real credentials
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

// Initialize Firebase safely (avoid multi-instance on Next.js hot reload)
export const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        isFirebaseConfigured
          ? firebaseConfig
          : {
              apiKey: "mock-key",
              authDomain: "mock-project.firebaseapp.com",
              projectId: "mock-project",
            }
      );

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Triggers Google Sign-in popup via Firebase Authentication
 */
export async function loginWithGoogle(): Promise<{
  name: string;
  email: string;
  avatar: string;
  uid: string;
}> {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_FIREBASE_API_KEY vào .env.local"
    );
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  return {
    name: user.displayName || "Bạn Nhậu",
    email: user.email || "",
    avatar:
      user.photoURL ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
        user.displayName || "User"
      )}`,
    uid: user.uid,
  };
}

/**
 * Signs in with Email and Password, or creates account if new
 */
export async function loginOrRegisterWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<{
  name: string;
  email: string;
  avatar: string;
  uid: string;
}> {
  if (!isFirebaseConfigured) {
    const cleanName = displayName || email.split("@")[0] || "Bạn Nhậu";
    return {
      name: cleanName,
      email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      uid: "mock-uid-" + Date.now(),
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    return {
      name: user.displayName || displayName || email.split("@")[0] || "Bạn Nhậu",
      email: user.email || email,
      avatar:
        user.photoURL ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          user.displayName || email
        )}`,
      uid: user.uid,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-credential"
    ) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        if (displayName) {
          await updateProfile(user, { displayName });
        }
        return {
          name: displayName || email.split("@")[0] || "Bạn Nhậu",
          email: user.email || email,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            displayName || email
          )}`,
          uid: user.uid,
        };
      } catch (createErr: unknown) {
        throw createErr;
      }
    }
    throw err;
  }
}

/**
 * Signs out current user from Firebase
 */
export async function logoutFirebase(): Promise<void> {
  if (!isFirebaseConfigured) return;
  await signOut(auth);
}

/**
 * Persistent Auth listener: restores user session automatically on F5 / page reload
 */
export function onAuthUserChanged(
  callback: (user: { name: string; email: string; avatar: string; uid: string } | null) => void
): () => void {
  // Check safeStorage first for instant rendering
  const saved = safeStorage.getItem("drinklab_user_session");
  if (saved) {
    try {
      callback(JSON.parse(saved));
    } catch {}
  }

  if (!isFirebaseConfigured || !auth) {
    return () => {};
  }

  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const cleanUser = {
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Bạn Nhậu",
        email: firebaseUser.email || "",
        avatar:
          firebaseUser.photoURL ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            firebaseUser.displayName || firebaseUser.email || "User"
          )}`,
        uid: firebaseUser.uid,
      };
      safeStorage.setItem("drinklab_user_session", JSON.stringify(cleanUser));
      callback(cleanUser);
    } else {
      safeStorage.removeItem("drinklab_user_session");
      callback(null);
    }
  });

  return unsubscribe;
}
