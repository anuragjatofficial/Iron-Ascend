import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect, AuthError, getRedirectResult, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { UserProfile, WorkoutPlan } from '../types';
import { DEFAULT_PLAN } from '../constants';
import { Dumbbell, LogIn, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC<{ onUserChange: (user: UserProfile | null) => void }> = ({ onUserChange }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const upsertUserProfile = async (firebaseUser: User) => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      const planRef = doc(collection(db, 'workoutPlans'));
      const newPlan: WorkoutPlan = {
        ...DEFAULT_PLAN,
        uid: firebaseUser.uid,
        id: planRef.id
      };
      await setDoc(planRef, newPlan);

      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Iron Athlete',
        email: firebaseUser.email || '',
        streak: 0,
        xp: 0,
        level: 1,
        activePlanId: planRef.id
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      onUserChange(newUser);
    } else {
      onUserChange(userDoc.data() as UserProfile);
    }
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          upsertUserProfile(result.user);
        }
      })
      .catch((err) => {
        console.error('Redirect auth error:', err);
        setErrorMessage((err as AuthError)?.message || 'Unable to complete sign in.');
      });
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        await upsertUserProfile(result.user);
      }
    } catch (error) {
      const err = error as AuthError;
      console.error('Auth error:', err);

      // If popup is blocked or third-party cookies are off, fall back to redirect which works without popups.
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
        return;
      }

      // Surface a helpful hint for common domain/origin misconfigurations.
      if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage('Sign-in blocked: add your dev origin (e.g., http://localhost:3000) to Firebase Auth > Authorized domains and to your Google OAuth client origins.');
      } else {
        setErrorMessage(err?.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        <div className="flex justify-center">
          <div className="p-6 bg-emerald-500/20 rounded-full border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Dumbbell className="w-16 h-16 text-emerald-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Iron <span className="text-emerald-500">Ascend</span>
          </h1>
          <p className="text-zinc-400 font-medium">
            Forge your physique. Track your progression. Level up your strength.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-300 transform active:scale-95 disabled:opacity-50"
        >
          <LogIn className="w-5 h-5" />
          {loading ? 'CONNECTING...' : 'SIGN IN WITH GOOGLE'}
        </button>

        {errorMessage && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-12 border-t border-zinc-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">100%</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Natural</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">PPL</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Focused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">PRO</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Tracking</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
