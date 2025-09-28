import { useEffect, useState } from 'react';

import '../../styles/GamificationPage.scss';
import { GamificationService, XPRecord } from '../../utils/gamification.ts';

const aggregateByDay = (records: XPRecord[]) => {
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
  return 'bg-slate-900';
};

interface UserData {
  uuid?: string;
  id?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
}

export const ContributionGraph = ({ user }: { user: UserData}) => {
  const [records, setRecords] = useState<XPRecord[] | null>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        if (!user.id) return;
        const data = await GamificationService.getUserXPRecords(user.id);
        setRecords(data);
        console.log("Set data", data)
      } catch (err) {
        console.error("Failed to load XP records:", err);
      }
    };

    void fetchRecords();
  }, [user?.id]);

  const xpByDay = aggregateByDay(records || []);

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
