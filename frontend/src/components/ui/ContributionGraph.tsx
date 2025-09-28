import React from 'react';

import '../../styles/GamificationPage.scss';

const mockXpRecords = [
  { xp_amount: 10, created_at: '2025-01-03T12:00:00Z' },
  { xp_amount: 25, created_at: '2025-01-15T12:00:00Z' },
  { xp_amount: 50, created_at: '2025-02-07T12:00:00Z' },
  { xp_amount: 5, created_at: '2025-02-19T12:00:00Z' },
  { xp_amount: 70, created_at: '2025-03-15T12:00:00Z' },
  { xp_amount: 101, created_at: '2025-04-05T12:00:00Z' },
  { xp_amount: 9, created_at: '2025-04-12T12:00:00Z' },
  { xp_amount: 20, created_at: '2025-05-01T12:00:00Z' },
  { xp_amount: 44, created_at: '2025-05-20T12:00:00Z' },
  { xp_amount: 5, created_at: '2025-06-02T12:00:00Z' },
  { xp_amount: 88, created_at: '2025-06-18T12:00:00Z' },
  { xp_amount: 101, created_at: '2025-07-01T12:00:00Z' },
  { xp_amount: 9, created_at: '2025-07-16T12:00:00Z' },
  { xp_amount: 15, created_at: '2025-07-29T12:00:00Z' },
  { xp_amount: 33, created_at: '2025-08-10T12:00:00Z' },
  { xp_amount: 55, created_at: '2025-08-25T12:00:00Z' },
  { xp_amount: 77, created_at: '2025-09-05T12:00:00Z' },
  { xp_amount: 2, created_at: '2025-09-12T12:00:00Z' },
  { xp_amount: 99, created_at: '2025-09-21T12:00:00Z' },
  { xp_amount: 150, created_at: '2025-09-27T12:00:00Z' },
];

const aggregateByDay = (records: typeof mockXpRecords) => {
  const map = new Map<string, number>();
  records.forEach((rec) => {
    const date = rec.created_at.split('T')[0];
    map.set(date, (map.get(date) || 0) + rec.xp_amount);
  });
  return map;
};

const getLevelClass = (xp: number) => {
  if (xp === 0) return 'my-bg';
  if (xp < 11) return 'bg-teal-200';
  if (xp < 31) return 'bg-yellow-300';
  if (xp < 101) return 'bg-pink-600';
  return 'bg-zinc-700';
};

export const ContributionGraph: React.FC = () => {
  const xpByDay = aggregateByDay(mockXpRecords);

  const today = new Date();
  const days: { date: string; xp: number; weekday: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({
      date: key,
      xp: xpByDay.get(key) || 0,
      weekday: d.getDay(),
    });
  }

  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div
      className="flex space-x-2 overflow-x-auto bg-theme rounded-lg shadow overflow-x-scroll scrollbar-custom overflow-y-hidden"
      style={{ scrollbarWidth: 'thin', paddingBottom: '10px' }}
    >
      <div
        className="sticky left-0 flex flex-col justify-between text-xs text-gray-500 gap-1 bg-theme text-left"
        style={{ paddingRight: '10px' }}
      >
        {weekDays.map((day) => (
          <div key={day} className="h-4 text-theme">
            {day}
          </div>
        ))}
      </div>

      <div className="flex space-x-1 gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col space-y-1 gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-4 h-4 rounded-xs ${getLevelClass(day.xp)}`}
                title={`${day.date}: ${day.xp} XP`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
