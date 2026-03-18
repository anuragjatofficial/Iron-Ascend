import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { UserProfile, WorkoutPlan } from '../types';
import { DEFAULT_PLAN } from '../constants';
import { Dumbbell, LogIn, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC<{ onUserChange: (user: UserProfile | null) => void }> = ({ onUserChange }) => {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const planRef = doc(collection(db, 'workoutPlans'));
        const newPlan: WorkoutPlan = {
          ...DEFAULT_PLAN,
          uid: user.uid,
          id: planRef.id
        };
        await setDoc(planRef, newPlan);

        const newUser: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Iron Athlete',
          email: user.email || '',
          streak: 0,
          xp: 0,
          level: 1,
          activePlanId: planRef.id
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        onUserChange(newUser);
      } else {
        onUserChange(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Auth error:', error);
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
