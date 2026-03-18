import React, { useState, useEffect } from 'react';
import { WorkoutPlan, WorkoutDayPlan, ExercisePlan, WorkoutType, DayType } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Save, Plus, Trash2, ChevronLeft, Dumbbell, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

export const PlanEditor: React.FC<{ planId: string, onBack: () => void }> = ({ planId, onBack }) => {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    const fetchPlan = async () => {
      const docSnap = await getDoc(doc(db, 'workoutPlans', planId));
      if (docSnap.exists()) {
        const data = docSnap.data() as WorkoutPlan;
        // Normalize keys to numbers to prevent string/number mismatch
        const normalizedDays: any = {};
        Object.entries(data.days || {}).forEach(([key, value]) => {
          normalizedDays[parseInt(key)] = value;
        });
        setPlan({ ...data, days: normalizedDays });
      }
      setLoading(false);
    };
    fetchPlan();
  }, [planId]);

  const handleSave = async () => {
    if (!plan) return;
    try {
      await updateDoc(doc(db, 'workoutPlans', planId), {
        days: plan.days,
        name: plan.name
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const updateDay = (dayNum: number, updates: Partial<WorkoutDayPlan>) => {
    if (!plan) return;
    setPlan({
      ...plan,
      days: {
        ...plan.days,
        [dayNum]: { ...plan.days[dayNum], ...updates }
      }
    });
  };

  const addExercise = (dayNum: number) => {
    if (!plan) return;
    const newExercise: ExercisePlan = { name: 'New Exercise', sets: 3, reps: '10' };
    const currentExercises = plan.days[dayNum].exercises;
    updateDay(dayNum, { exercises: [...currentExercises, newExercise] });
  };

  const updateExercise = (dayNum: number, exIdx: number, updates: Partial<ExercisePlan>) => {
    if (!plan) return;
    const newExercises = [...plan.days[dayNum].exercises];
    newExercises[exIdx] = { ...newExercises[exIdx], ...updates };
    updateDay(dayNum, { exercises: newExercises });
  };

  const removeExercise = (dayNum: number, exIdx: number) => {
    if (!plan) return;
    const newExercises = plan.days[dayNum].exercises.filter((_, i) => i !== exIdx);
    updateDay(dayNum, { exercises: newExercises });
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading Plan...</div>;
  if (!plan) return <div className="p-8 text-center text-red-500">Plan not found.</div>;

  const currentDayPlan = plan.days[activeDay];

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">Edit Protocol</h1>
        <button onClick={handleSave} className="p-2 bg-emerald-500 rounded-xl text-white">
          <Save className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[1, 2, 3, 4, 5, 6, 7].map(d => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-xl font-black italic flex items-center justify-center transition-all",
              activeDay === d ? "bg-emerald-500 text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            )}
          >
            D{d}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Type</label>
            <select
              value={currentDayPlan.type}
              onChange={(e) => updateDay(activeDay, { type: e.target.value as WorkoutType })}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 font-bold text-white outline-none"
            >
              <option value="Push">Push</option>
              <option value="Pull">Pull</option>
              <option value="Legs">Legs</option>
              <option value="Rest">Rest</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Focus</label>
            <select
              value={currentDayPlan.dayType}
              onChange={(e) => updateDay(activeDay, { dayType: e.target.value as DayType })}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 font-bold text-white outline-none"
            >
              <option value="Strength">Strength</option>
              <option value="Volume">Volume</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black italic uppercase tracking-widest">Exercises</h3>
            <button onClick={() => addExercise(activeDay)} className="p-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {currentDayPlan.exercises.map((ex, idx) => (
              <div key={idx} className="bg-black/40 border border-zinc-800/50 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <input
                    value={ex.name}
                    onChange={(e) => updateExercise(activeDay, idx, { name: e.target.value })}
                    className="bg-transparent border-b border-zinc-800 font-bold text-white outline-none flex-grow"
                  />
                  <button onClick={() => removeExercise(activeDay, idx)} className="text-zinc-700 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Sets</span>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(activeDay, idx, { sets: parseInt(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Reps</span>
                    <input
                      value={ex.reps}
                      onChange={(e) => updateExercise(activeDay, idx, { reps: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
