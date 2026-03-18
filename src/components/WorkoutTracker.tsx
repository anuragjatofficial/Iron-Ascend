import React, { useState, useEffect } from 'react';
import { WorkoutType, ExerciseLog, Set, UserProfile, WorkoutDayPlan } from '../types';
import { getLevel } from '../constants';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { Timer, Save, Plus, Trash2, CheckCircle2, ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Info, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WorkoutTracker: React.FC<{ user: UserProfile, plan: WorkoutDayPlan, onComplete: () => void }> = ({ user, plan, onComplete }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<Set[]>([{ weight: 0, reps: 0 }]);
  const [lastLog, setLastLog] = useState<ExerciseLog | null>(null);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const exercises = plan.exercises;
  const currentExercisePlan = exercises[currentExerciseIndex];
  const currentExercise = currentExercisePlan?.name;

  useEffect(() => {
    if (!currentExercise) return;

    const fetchLastLog = async () => {
      const q = query(
        collection(db, 'exerciseLogs'),
        where('uid', '==', user.uid),
        where('exerciseName', '==', currentExercise),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLastLog(snap.docs[0].data() as ExerciseLog);
      } else {
        setLastLog(null);
      }
    };
    fetchLastLog();
    
    // Initialize sets based on plan
    const initialSets: Set[] = [];
    for (let i = 0; i < (currentExercisePlan?.sets || 1); i++) {
      initialSets.push({ weight: 0, reps: 0 });
    }
    setSets(initialSets);
  }, [currentExercise, user.uid, currentExercisePlan]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { ...lastSet }]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleSetChange = (index: number, field: keyof Set, value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const calculateProgression = (current: Set[], last: ExerciseLog | null): ExerciseLog['progression'] => {
    if (!last) return 'PROGRESS';
    const currentMax = Math.max(...current.map(s => s.weight));
    const lastMax = Math.max(...last.sets.map(s => s.weight));
    const currentTotalReps = current.reduce((acc, s) => acc + s.reps, 0);
    const lastTotalReps = last.sets.reduce((acc, s) => acc + s.reps, 0);

    if (currentMax > lastMax) return 'LEVEL UP';
    if (currentMax === lastMax && currentTotalReps > lastTotalReps) return 'PROGRESS';
    if (currentMax === lastMax && currentTotalReps === lastTotalReps) return 'STAGNANT';
    return 'REGRESSION';
  };

  const handleSaveExercise = async () => {
    if (!currentExercise) return;
    setSaving(true);
    const progression = calculateProgression(sets, lastLog);
    const level = getLevel(currentExercise, Math.max(...sets.map(s => s.weight)));
    
    const log: ExerciseLog = {
      uid: user.uid,
      exerciseName: currentExercise,
      date: new Date().toISOString(),
      sets,
      level,
      progression
    };

    try {
      await addDoc(collection(db, 'exerciseLogs'), log);
      // Update user XP
      const xpGain = sets.length * 10 + (progression === 'LEVEL UP' ? 50 : progression === 'PROGRESS' ? 20 : 5);
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(xpGain),
        streak: increment(1),
        lastWorkoutDate: new Date().toISOString()
      });
      
      setCompletedExercises([...completedExercises, currentExercise]);
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setTimer(0);
        setIsTimerActive(true); // Auto start rest timer
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentExercisePlan) return null;

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onComplete} className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{plan.type} {plan.dayType}</h2>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Exercise {currentExerciseIndex + 1}/{exercises.length}</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DumbbellIcon className="w-24 h-24" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">{currentExercise}</h3>
            <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-emerald-500 uppercase tracking-widest">{currentExercisePlan.sets}x{currentExercisePlan.reps}</span>
              {currentExercisePlan.progression && (
                <span className="flex items-center gap-1 text-yellow-500/80"><TrendingUp className="w-3 h-3" /> {currentExercisePlan.progression}</span>
              )}
            </div>
          </div>
          
          {currentExercisePlan.note && (
            <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-emerald-200/70 uppercase tracking-wider">{currentExercisePlan.note}</p>
            </div>
          )}

          {lastLog && (
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 border-t border-zinc-800/50 pt-4">
              <span className="uppercase tracking-widest">Last Performance:</span>
              <span className="text-emerald-500/80">{Math.max(...lastLog.sets.map(s => s.weight))}kg × {lastLog.sets[0].reps}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          <div className="col-span-2">Set</div>
          <div className="col-span-4">Weight (kg)</div>
          <div className="col-span-4">Reps</div>
          <div className="col-span-2"></div>
        </div>

        <div className="space-y-3">
          {sets.map((set, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-12 gap-4 items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50"
            >
              <div className="col-span-2 font-black italic text-zinc-500 text-xl">#{idx + 1}</div>
              <div className="col-span-4">
                <input 
                  type="number" 
                  value={set.weight || ''} 
                  onChange={(e) => handleSetChange(idx, 'weight', parseFloat(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-center font-black text-xl text-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="col-span-4">
                <input 
                  type="number" 
                  value={set.reps || ''} 
                  onChange={(e) => handleSetChange(idx, 'reps', parseInt(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-center font-black text-xl text-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button onClick={() => handleRemoveSet(idx)} className="text-zinc-700 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={handleAddSet}
          className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> ADD SET
        </button>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Timer className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rest Timer</div>
            <div className="text-2xl font-black italic text-white">{formatTime(timer)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTimerActive(!isTimerActive)}
            className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            {isTimerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => { setTimer(0); setIsTimerActive(false); }}
            className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <button 
        onClick={handleSaveExercise}
        disabled={saving}
        className="w-full bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
      >
        <Save className="w-6 h-6" />
        {saving ? 'SAVING...' : 'LOG EXERCISE & NEXT'}
      </button>
    </div>
  );
};

const DumbbellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="m3 21 18-18" />
    <path d="m3 3 18 18" />
  </svg>
);
