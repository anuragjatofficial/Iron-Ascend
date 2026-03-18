import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, WorkoutType, WorkoutDayPlan } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { WorkoutTracker } from './components/WorkoutTracker';
import { ProgressCharts } from './components/ProgressCharts';
import { Profile } from './components/Profile';
import { PlanEditor } from './components/PlanEditor';
import { LayoutGrid, Dumbbell, BarChart3, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workout' | 'analytics' | 'profile' | 'plan-editor'>('dashboard');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutDayPlan | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Use onSnapshot for real-time user updates
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserProfile;
            // Calculate level based on XP
            const level = Math.floor(userData.xp / 1000) + 1;
            setUser({ ...userData, level });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 font-black italic uppercase tracking-widest animate-pulse">Initializing Protocol...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onUserChange={setUser} />;
  }

  const renderContent = () => {
    if (activeWorkout) {
      return (
        <WorkoutTracker 
          user={user} 
          plan={activeWorkout} 
          onComplete={() => {
            setActiveWorkout(null);
            setActiveTab('dashboard');
          }} 
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} onStartWorkout={(plan) => setActiveWorkout(plan)} />;
      case 'analytics':
        return <ProgressCharts user={user} />;
      case 'profile':
        return <Profile user={user} onUpdate={setUser} onEditPlan={() => setActiveTab('plan-editor')} />;
      case 'plan-editor':
        return <PlanEditor planId={user.activePlanId!} onBack={() => setActiveTab('profile')} />;
      default:
        return <Dashboard user={user} onStartWorkout={(plan) => setActiveWorkout(plan)} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      <main className="max-w-md mx-auto px-6 pt-12 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (activeWorkout || '')}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {!activeWorkout && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-2xl border-t border-zinc-800/50 pb-8 pt-4 px-8 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutGrid className="w-6 h-6" />} 
              label="Home"
            />
            <NavButton 
              active={activeTab === 'workout'} 
              onClick={() => setActiveTab('dashboard')} // Redirect to dashboard to start workout
              icon={<Dumbbell className="w-6 h-6" />} 
              label="Train"
            />
            <NavButton 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')} 
              icon={<BarChart3 className="w-6 h-6" />} 
              label="Stats"
            />
            <NavButton 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
              icon={<User className="w-6 h-6" />} 
              label="Pro"
            />
          </div>
        </nav>
      )}
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-1 transition-all duration-300 relative",
      active ? "text-emerald-500 scale-110" : "text-zinc-600 hover:text-zinc-400"
    )}
  >
    {active && (
      <motion.div 
        layoutId="nav-active"
        className="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full"
      />
    )}
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
