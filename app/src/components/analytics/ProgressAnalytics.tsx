import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Sparkles, 
  CheckCircle 
} from 'lucide-react';
import { localDb } from '../../db/storage';
import type { TestAttempt } from '../../types';

export const ProgressAnalytics: React.FC = () => {
  const [attempts, setAttempts] = React.useState<TestAttempt[]>([]);

  React.useEffect(() => {
    setAttempts(localDb.getAttempts());
  }, []);

  const chartData = attempts
    .slice()
    .reverse()
    .map(att => ({
      name: `Test ${att.book}.${att.testNumber}`,
      overall: att.overallBand,
      listening: att.bandScoreListening ?? 0,
      reading: att.bandScoreReading ?? 0,
      date: new Date(att.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));

  const avgOverall = attempts.length
    ? (attempts.reduce((acc, cur) => acc + cur.overallBand, 0) / attempts.length).toFixed(1)
    : '0.0';

  const bestBand = attempts.length
    ? Math.max(...attempts.map(a => a.overallBand)).toFixed(1)
    : '0.0';

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" /> Band Score Analytics & Study Velocity
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking your Cambridge IELTS simulated exam progress across Listening & Reading modules.
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
              <span>Average Band</span>
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{avgOverall}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Across all modules</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
              <span>Peak Band</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600 font-mono">{bestBand}</div>
            <p className="text-[11px] text-slate-500 mt-1">Academic simulation record</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
              <span>Tests Completed</span>
              <CheckCircle className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{attempts.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Cambridge tests logged</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
              <span>Study Target</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-indigo-600 font-mono">8.0</div>
            <p className="text-[11px] text-slate-500 mt-1">Admissions target score</p>
          </div>
        </div>

        {/* Band Trajectory Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Band Score Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Overall, Listening, and Reading historical progress</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Overall
              </span>
              <span className="flex items-center gap-1.5 text-cyan-600">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Listening
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Reading
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" domain={[4, 9]} ticks={[4, 5, 6, 7, 8, 9]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '1rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Overall Band"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="listening"
                  name="Listening"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="reading"
                  name="Reading"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#d97706' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-4">Historical Test Attempts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Test</th>
                  <th className="py-3 px-3">Module</th>
                  <th className="py-3 px-3">Listening</th>
                  <th className="py-3 px-3">Reading</th>
                  <th className="py-3 px-3">Overall Band</th>
                  <th className="py-3 px-3">Date Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-50 text-slate-700">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      Cambridge {att.book} (Test {att.testNumber})
                    </td>
                    <td className="py-3.5 px-3 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-medium">
                        {att.moduleType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium">
                      {att.bandScoreListening !== undefined ? `${att.bandScoreListening.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium">
                      {att.bandScoreReading !== undefined ? `${att.bandScoreReading.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-indigo-700 font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {att.overallBand.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono">
                      {new Date(att.completedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
