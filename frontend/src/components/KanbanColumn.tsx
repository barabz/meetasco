import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { List, Card } from '../types';
import KanbanCard from './KanbanCard';
import api from '../api/client';

interface Props {
  list: List;
  onCardClick: (card: Card) => void;
  onCardAdded: (listId: number, card: Card) => void;
  onListUpdated: (list: List) => void;
  onListDeleted: (listId: number) => void;
  onDragStart: (e: React.DragEvent, cardId: number, fromListId: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropCard: (e: React.DragEvent, toListId: number) => void;
  onColDragStart: (e: React.DragEvent, listId: number) => void;
  onColDragOver: (e: React.DragEvent, listId: number) => void;
  onColDrop: (e: React.DragEvent, listId: number) => void;
  isDragOver: boolean;
}

export default function KanbanColumn({
  list, onCardClick, onCardAdded, onListUpdated, onListDeleted,
  onDragStart, onDragOver, onDropCard,
  onColDragStart, onColDragOver, onColDrop,
  isDragOver,
}: Props) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    try {
      const { data } = await api.post(`/api/lists/${list.id}/cards`, { title: newCardTitle.trim() });
      onCardAdded(list.id, data);
      setNewCardTitle('');
      setAddingCard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameList = async () => {
    if (!listTitle.trim()) { setListTitle(list.title); setEditingTitle(false); return; }
    try {
      const { data } = await api.put(`/api/lists/${list.id}`, { title: listTitle.trim() });
      onListUpdated(data);
    } finally {
      setEditingTitle(false);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm(`Delete list "${list.title}" and all its cards?`)) return;
    try {
      await api.delete(`/api/lists/${list.id}`);
      onListDeleted(list.id);
    } catch (err) {
      console.error(err);
    }
  };

  const sortedCards = [...list.cards].sort((a, b) => a.position - b.position);

  return (
    <div
      className={`kanban-column${isDragOver ? ' col-drop-target' : ''}`}
      draggable
      onDragStart={(e) => onColDragStart(e, list.id)}
      onDragOver={(e) => { e.preventDefault(); onColDragOver(e, list.id); }}
      onDrop={(e) => onColDrop(e, list.id)}
    >
      {/* Column header */}
      <div className="column-header" onClick={(e) => e.stopPropagation()}>
        <div className="column-header-left">
          {editingTitle ? (
            <input
              className="column-title-input"
              value={listTitle}
              autoFocus
              onChange={(e) => setListTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameList(); if (e.key === 'Escape') { setListTitle(list.title); setEditingTitle(false); } }}
              onBlur={handleRenameList}
            />
          ) : (
            <span className="column-title" onDoubleClick={() => setEditingTitle(true)}>
              {list.title}
            </span>
          )}
          <span className="column-count">{list.cards.length}</span>
        </div>
        <div className="column-actions">
          <button className="icon-btn-xs" onClick={() => setEditingTitle(true)} title="Rename">
            <Pencil size={12} />
          </button>
          <button className="icon-btn-xs danger" onClick={handleDeleteList} title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        className="column-cards"
        onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
        onDrop={(e) => { e.stopPropagation(); onDropCard(e, list.id); }}
      >
        {sortedCards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      {/* Add card */}
      {addingCard ? (
        <div className="add-card-form">
          <textarea
            className="add-card-input"
            placeholder="Card title..."
            rows={2}
            autoFocus
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); } }}
          />
          <div className="add-card-actions">
            <button className="btn-primary btn-sm" onClick={handleAddCard}>Add card</button>
            <button className="icon-btn-xs" onClick={() => { setAddingCard(false); setNewCardTitle(''); }}>
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button className="add-card-btn" onClick={() => setAddingCard(true)}>
          <Plus size={14} /> Add a card
        </button>
      )}
    </div>
  );
}
