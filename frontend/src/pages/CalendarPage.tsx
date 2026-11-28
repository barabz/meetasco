import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';

interface DeadlineItem {
  card_id: number;
  title: string;
  deadline: string;
  board_id: number;
  board_title: string;
  board_color: string;
  list_title: string;
  is_completed: boolean;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/deadlines').then(({ data }) => setDeadlines(data));
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelected(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelected(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const deadlinesByDay: Record<number, DeadlineItem[]> = {};
  deadlines.forEach((d) => {
    const date = new Date(d.deadline);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!deadlinesByDay[day]) deadlinesByDay[day] = [];
      deadlinesByDay[day].push(d);
    }
  });

  const selectedItems = selected ? (deadlinesByDay[selected] ?? []) : [];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <Layout>
      <div className="calendar-page">
        <div className="calendar-header">
          <h1 className="calendar-title">Calendar</h1>
          <p className="calendar-subtitle">Card deadlines across all boards</p>
        </div>

        <div className="calendar-container">
          {/* Month nav */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <span className="cal-month-label">{MONTH_NAMES[month]} {year}</span>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>

          {/* Day headers */}
          <div className="cal-grid">
            {DAY_NAMES.map((d) => (
              <div key={d} className="cal-day-name">{d}</div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const items = deadlinesByDay[day] ?? [];
              const hasOverdue = items.some((d) => !d.is_completed && new Date(d.deadline) < today);
              return (
                <div
                  key={day}
                  className={[
                    'cal-cell',
                    isToday(day) ? 'cal-cell--today' : '',
                    selected === day ? 'cal-cell--selected' : '',
                    items.length ? 'cal-cell--has-events' : '',
                  ].join(' ')}
                  onClick={() => setSelected(selected === day ? null : day)}
                >
                  <span className={`cal-day-num${hasOverdue ? ' cal-day-overdue' : ''}`}>{day}</span>
                  <div className="cal-dots">
                    {items.slice(0, 3).map((item) => (
                      <span
                        key={item.card_id}
                        className="cal-dot"
                        style={{ background: item.board_color }}
                      />
                    ))}
                    {items.length > 3 && <span className="cal-dot-more">+{items.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selected && (
            <div className="cal-day-panel">
              <h3 className="cal-day-panel-title">
                {MONTH_NAMES[month]} {selected}, {year}
                <span className="cal-day-panel-count">{selectedItems.length} deadline{selectedItems.length !== 1 ? 's' : ''}</span>
              </h3>
              {selectedItems.length === 0 ? (
                <p className="cal-day-panel-empty">No deadlines this day.</p>
              ) : (
                <div className="cal-day-items">
                  {selectedItems.map((item) => (
                    <div
                      key={item.card_id}
                      className={`cal-day-item${item.is_completed ? ' cal-day-item--done' : ''}`}
                      onClick={() => navigate(`/boards/${item.board_id}`)}
                    >
                      <span className="cal-day-item-dot" style={{ background: item.board_color }} />
                      <div className="cal-day-item-info">
                        <span className="cal-day-item-title">{item.title}</span>
                        <span className="cal-day-item-meta">{item.board_title} · {item.list_title}</span>
                      </div>
                      {item.is_completed && <span className="cal-day-item-badge">Done</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
