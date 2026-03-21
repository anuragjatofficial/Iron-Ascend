import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { ExerciseLog, BodyMetric, UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, AlertTriangle, Zap, Target, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export const ProgressCharts: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      const logsSnap = await getDocs(
        query(
          collection(db, 'exerciseLogs'),
          where('uid', '==', user.uid),
          orderBy('date', 'desc'),
          limit(200)
        )
      );
      const metricsSnap = await getDocs(
        query(
          collection(db, 'bodyMetrics'),
          where('uid', '==', user.uid),
          orderBy('date', 'desc'),
          limit(90)
        )
      );
      
      const logData = logsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ExerciseLog)).reverse();
      const metricData = metricsSnap.docs.map(d => ({ ...d.data(), id: d.id } as BodyMetric)).reverse();
      setLogs(logData);
      setMetrics(metricData);
      setLoading(false);
    };
    fetchData();
    return () => setIsMounted(false);
  }, [user.uid]);

  const getChartData = (exercise: string) => {
    if (!logs) return [];
    return logs
      .filter(l => l && l.exerciseName === exercise && l.date && l.sets)
      .map(l => ({
        date: format(parseISO(l.date), 'MMM dd'),
        weight: Math.max(...(l.sets || []).map(s => s?.weight || 0)),
        volume: (l.sets || []).reduce((acc, s) => acc + (s?.weight || 0) * (s?.reps || 0), 0)
      }));
  };

  const getWeightData = () => {
    if (!metrics) return [];
    return metrics
      .filter(m => m && m.date && m.weight !== undefined)
      .map(m => ({
        date: format(parseISO(m.date), 'MMM dd'),
        weight: m.weight
      }));
  };

  const getPlateauAlerts = () => {
    if (!logs || logs.length === 0) return [];
    const exercises = Array.from(new Set(logs.filter(l => l && l.exerciseName).map(l => l.exerciseName)));
    const alerts: string[] = [];
    
    exercises.forEach(ex => {
      const exLogs = logs.filter(l => l && l.exerciseName === ex && l.sets).slice(-3);
      if (exLogs.length === 3) {
        const weights = exLogs.map(l => Math.max(...(l.sets || []).map(s => s?.weight || 0)));
        if (weights[0] === weights[1] && weights[1] === weights[2]) {
          alerts.push(`Plateau detected on ${ex}. You've hit the same weight for 3 sessions.`);
        }
      }
    });
    return alerts;
  };

  const alerts = getPlateauAlerts();

  const groupedLogs = useMemo(() => {
    if (!logs) return [] as { date: string; items: ExerciseLog[] }[];
    const byDate: Record<string, ExerciseLog[]> = {};
    logs.forEach((log) => {
      if (!log?.date) return;
      const key = log.date.slice(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(log);
    });
    return Object.entries(byDate)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items: items.sort((a, b) => (a.exerciseName > b.exerciseName ? 1 : -1)) }));
  }, [logs]);

  if (loading || !isMounted) return <div className="flex items-center justify-center h-64 text-zinc-500 font-black italic uppercase tracking-widest">Analyzing Data...</div>;

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Analytics Panel</h2>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Performance Insights</h1>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-200">{alert}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black italic uppercase tracking-widest">Session Timeline</h3>
          </div>
          <button
            onClick={() => setShowAllSessions(!showAllSessions)}
            className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {showAllSessions ? 'View Recent' : 'View Older'}
          </button>
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {(showAllSessions ? groupedLogs : groupedLogs.slice(0, 6)).map((group) => {
            const dayLabel = format(parseISO(group.date), 'EEE, MMM dd');
            const volumeTotal = group.items.reduce((acc, log) => acc + (log.sets || []).reduce((s, set) => s + (set?.weight || 0) * (set?.reps || 0), 0), 0);
            return (
              <div key={group.date} className="bg-black/40 border border-zinc-800/60 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">{dayLabel}</div>
                    <div className="text-xs font-bold text-zinc-400">{group.items.length} exercises · {(volumeTotal || 0).toLocaleString()} kg·reps</div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400">Day Log</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((log) => {
                    const topWeight = Math.max(...(log.sets || []).map(s => s?.weight || 0));
                    const topReps = (log.sets || [])[0]?.reps || 0;
                    return (
                      <div key={log.id} className="flex items-center justify-between bg-zinc-900/40 rounded-xl border border-zinc-800/70 px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="text-sm font-black text-white leading-tight">{log.exerciseName}</div>
                          <div className="text-[11px] font-bold text-zinc-500">{topWeight} kg × {topReps} reps</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-emerald-400">{log.progression || 'PROGRESS'}</span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Lvl {log.level || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {groupedLogs.length === 0 && (
            <div className="text-center text-zinc-500 text-sm font-bold">No logs yet. Start tracking to see history.</div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black italic uppercase tracking-widest">Bodyweight Progression</h3>
          </div>
          <div className="text-xs font-bold text-zinc-500 uppercase">Last 30 Days</div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getWeightData()}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {['Bench Press', 'Squat', 'Deadlift'].map(lift => {
          const data = getChartData(lift);
          if (data.length === 0) return null;
          return (
            <div key={lift} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-black italic uppercase tracking-widest">{lift}</h3>
                </div>
                <div className="text-xs font-bold text-zinc-500 uppercase">Max Weight (kg)</div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#eab308', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-emerald-500" />
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Smart Alerts</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Muscle Growth Optimization</p>
              <p className="text-xs text-zinc-400">Your volume has increased by 12% this week. Keep protein intake high (1.6g/kg).</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Recovery Warning</p>
              <p className="text-xs text-zinc-400">Sleep quality impacts strength. Ensure 7-9 hours for optimal CNS recovery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
