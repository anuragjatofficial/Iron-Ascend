import React, { useEffect, useState } from 'react';
import { UserProfile, WorkoutType, ExerciseLog, BodyMetric, WorkoutPlan, WorkoutDayPlan } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, subWeeks, isSameDay } from 'date-fns';
import { Trophy, Flame, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC<{ user: UserProfile, onStartWorkout: (plan: WorkoutDayPlan) => void }> = ({ user, onStartWorkout }) => {
  const [lastLogs, setLastLogs] = useState<ExerciseLog[]>([]);
  const [lastMetrics, setLastMetrics] = useState<BodyMetric[]>([]);
  const [strengthScore, setStrengthScore] = useState(0);
  const [weightChange, setWeightChange] = useState(0);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active plan
      if (user.activePlanId) {
        const planDoc = await getDoc(doc(db, 'workoutPlans', user.activePlanId));
        if (planDoc.exists()) {
          setActivePlan(planDoc.data() as WorkoutPlan);
        }
      }

      // Fetch last 3 big lifts for strength score
      const bigLifts = ['Bench Press', 'Squat', 'Deadlift'];
      let total = 0;
      for (const lift of bigLifts) {
        const q = query(
          collection(db, 'exerciseLogs'),
          where('uid', '==', user.uid),
          where('exerciseName', '==', lift),
          orderBy('date', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const log = snap.docs[0].data() as ExerciseLog;
          const maxWeight = Math.max(0, ...(log.sets || []).map(s => s?.weight || 0));
          total += maxWeight;
        }
      }
      setStrengthScore(total);

      // Fetch last 2 weight entries for change
      const mq = query(
        collection(db, 'bodyMetrics'),
        where('uid', '==', user.uid),
        orderBy('date', 'desc'),
        limit(2)
      );
      const mSnap = await getDocs(mq);
      if (mSnap.docs.length >= 2) {
        const current = mSnap.docs[0].data() as BodyMetric;
        const previous = mSnap.docs[1].data() as BodyMetric;
        setWeightChange(current.weight - previous.weight);
      }
    };
    fetchData();
  }, [user.uid, user.activePlanId]);

  const getTodayWorkout = (): WorkoutDayPlan | null => {
    if (!activePlan || !activePlan.days) return null;
    const day = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    // Map JS getDay() to our 1-7 system (1=Mon, 7=Sun)
    const dayMap: Record<number, number> = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 0: 7
    };
    const dayNum = dayMap[day];
    // Firestore keys are strings, so we check both to be safe
    return (activePlan.days[dayNum] || (activePlan.days as any)[dayNum.toString()]) || null;
  };

  const todayWorkout = getTodayWorkout();

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Welcome back,</h2>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">{user.displayName}</h1>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-2xl">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <span className="text-xl font-black italic">{user.streak}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Weight</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black italic">{user.currentWeight || '--'}</span>
            <span className="text-sm font-bold text-zinc-500 uppercase">KG</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold">
            {weightChange > 0 ? (
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> +{weightChange.toFixed(1)}</span>
            ) : weightChange < 0 ? (
              <span className="text-red-500 flex items-center"><ArrowDownRight className="w-3 h-3" /> {weightChange.toFixed(1)}</span>
            ) : (
              <span className="text-zinc-500 flex items-center"><Minus className="w-3 h-3" /> 0.0</span>
            )}
            <span className="text-zinc-500 uppercase tracking-tighter ml-1">Weekly Change</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Strength Score</span>
            <Trophy className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black italic">{strengthScore}</span>
            <span className="text-sm font-bold text-zinc-500 uppercase">KG</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">B + S + D Total</div>
        </motion.div>
      </div>

      {todayWorkout && todayWorkout.type !== 'Rest' ? (
        <div className="bg-emerald-500 p-8 rounded-3xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <Calendar className="w-32 h-32 -mr-8 -mt-8" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Today's Protocol</h3>
                <span className="bg-emerald-900/20 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded uppercase">{todayWorkout.dayType}</span>
              </div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">{todayWorkout.type} Day</h2>
            </div>
            <button 
              onClick={() => onStartWorkout(todayWorkout)}
              className="w-full bg-white text-emerald-600 font-black py-4 rounded-2xl hover:bg-emerald-50 transition-colors shadow-lg active:scale-95"
            >
              START SESSION
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Rest Day</h3>
          </div>
          <p className="text-zinc-400 text-sm font-medium">
            Recovery is where the growth happens. Focus on nutrition and mobility today.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Active Plan: {activePlan?.name || 'Loading...'}</h3>
        <div className="grid grid-cols-1 gap-3">
          {['Bench Press', 'Squat', 'Deadlift'].map((lift) => (
            <div key={lift} className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-zinc-300">{lift}</span>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs font-black text-emerald-500 uppercase">Level 3</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
