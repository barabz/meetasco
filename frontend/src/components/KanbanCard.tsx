import { GripVertical } from 'lucide-react';
import type { Card } from '../types';
import DeadlineBadge from './DeadlineBadge';

interface Props {
  card: Card;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, cardId: number, fromListId: number) => void;
}

export default function KanbanCard({ card, onClick, onDragStart }: Props) {
  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e, card.id, card.list_id);
      }}
      onClick={onClick}
    >
      <div className="card-drag-handle">
        <GripVertical size={14} />
      </div>

      <div className="card-body">
        {card.labels.length > 0 && (
          <div className="card-labels">
            {card.labels.map((label) => (
              <span
                key={label.id}
                className="card-label-chip"
                style={{ backgroundColor: label.color }}
                title={label.name}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <span className={`card-title${card.is_completed ? ' completed' : ''}`}>
          {card.title}
        </span>

        {card.description && (
          <p className="card-desc">{card.description}</p>
        )}

        <div className="card-footer">
          <div className="card-footer-left">
            {card.deadline && <DeadlineBadge deadline={card.deadline} isCompleted={card.is_completed} />}
          </div>
          <div className="card-footer-right">
            {card.members.length > 0 && (
              <div className="member-pile">
                {card.members.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="member-avatar-sm"
                    style={{ backgroundColor: m.avatar_color }}
                    title={m.full_name}
                  >
                    {m.full_name[0].toUpperCase()}
                  </div>
                ))}
                {card.members.length > 3 && (
                  <div className="member-avatar-sm member-overflow">
                    +{card.members.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
