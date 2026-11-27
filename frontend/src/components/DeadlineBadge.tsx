import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface Props {
  deadline: string | null;
  completed?: boolean;
}

export default function DeadlineBadge({ deadline, completed }: Props) {
  if (!deadline) return null;
  const date = new Date(deadline);

  let label = format(date, 'MMM d');
  let cls = 'badge badge-deadline';

  if (completed) {
    cls += ' badge-done';
  } else if (isPast(date) && !isToday(date)) {
    cls += ' badge-overdue';
    label = `Overdue · ${format(date, 'MMM d')}`;
  } else if (isToday(date)) {
    cls += ' badge-today';
    label = `Today`;
  } else if (isTomorrow(date)) {
    cls += ' badge-soon';
    label = `Tomorrow`;
  } else if (differenceInDays(date, new Date()) <= 3) {
    cls += ' badge-soon';
    label = `${format(date, 'MMM d')}`;
  }

  return <span className={cls}>📅 {label}</span>;
}
