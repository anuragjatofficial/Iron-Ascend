import React, { useState } from 'react';
import { UserProfile, BodyMetric } from '../types';
import { db, auth } from '../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { User, Scale, Ruler, Target, LogOut, Save, Trophy, Star, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import { signOut } from 'firebase/auth';

export const Profile: React.FC<{ user: UserProfile, onUpdate: (user: UserProfile) => void, onEditPlan: () => void }> = ({ user, onUpdate, onEditPlan }) => {
  const [height, setHeight] = useState(user.height || 0);
  const [goalWeight, setGoalWeight] = useState(user.goalWeight || 0);
  const [currentWeight, setCurrentWeight] = useState(user.currentWeight || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const h = isNaN(height) ? 0 : height;
      const gw = isNaN(goalWeight) ? 0 : goalWeight;
      const cw = isNaN(currentWeight) ? 0 : currentWeight;
      
      const updatedUser = { ...user, height: h, goalWeight: gw, currentWeight: cw };
      await updateDoc(doc(db, 'users', user.uid), {
        height: h,
        goalWeight: gw,
        currentWeight: cw
      });
      
      // Also log a body metric entry
      await addDoc(collection(db, 'bodyMetrics'), {
        uid: user.uid,
        date: new Date().toISOString(),
        weight: cw
      } as BodyMetric);

      onUpdate(updatedUser);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const nextLevelXp = user.level * 1000;
  const progress = (user.xp % 1000) / 10;

  return (
    <div className="space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Athlete Profile</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={onEditPlan}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Star className="w-32 h-32" />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-1 bg-emerald-500 rounded-full">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center border-4 border-black overflow-hidden">
              <User className="w-12 h-12 text-zinc-700" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{user.displayName}</h2>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Level {user.level}</div>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{user.xp} XP Total</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            <span>Progress to Level {user.level + 1}</span>
            <span>{user.xp % 1000} / 1000 XP</span>
          </div>
          <div className="h-3 bg-black rounded-full overflow-hidden border border-zinc-800">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black italic uppercase tracking-widest">Body Stats</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Current Weight (kg)</label>
              <input 
                type="number" 
                value={currentWeight || ''} 
                onChange={(e) => setCurrentWeight(parseFloat(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 font-black text-xl text-white focus:border-emerald-500 outline-none"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Goal Weight (kg)</label>
              <input 
                type="number" 
                value={goalWeight || ''} 
                onChange={(e) => setGoalWeight(parseFloat(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 font-black text-xl text-white focus:border-emerald-500 outline-none"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Height (cm)</label>
              <input 
                type="number" 
                value={height || ''} 
                onChange={(e) => setHeight(parseFloat(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 font-black text-xl text-white focus:border-emerald-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-white text-black font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
      >
        <Save className="w-6 h-6" />
        {saving ? 'SAVING...' : 'UPDATE ATHLETE PROFILE'}
      </button>

      <div className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Milestones</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800/50 grayscale opacity-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-800 rounded-xl">
                <Star className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white">100kg Bench Press</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black">Locked</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800/50 grayscale opacity-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-800 rounded-xl">
                <Star className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white">30 Day Streak</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black">Locked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
