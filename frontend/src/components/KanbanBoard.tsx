import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { Board, Card, List } from '../types';
import KanbanColumn from './KanbanColumn';
import api from '../api/client';

interface Props {
  board: Board;
  onCardClick: (card: Card) => void;
  onBoardChange: (board: Board) => void;
}

export default function KanbanBoard({ board, onCardClick, onBoardChange }: Props) {
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [dropOverListId, setDropOverListId] = useState<number | null>(null);

  // Store drag state in refs to avoid stale closures
  const draggingCardId  = useRef<number | null>(null);
  const draggingCardFromList = useRef<number | null>(null);
  const draggingListId  = useRef<number | null>(null);

  const sortedLists = [...board.lists].sort((a, b) => a.position - b.position);

  // ── Card drag handlers ────────────────────────────────────────────────────
  const handleCardDragStart = (e: React.DragEvent, cardId: number, fromListId: number) => {
    draggingCardId.current = cardId;
    draggingCardFromList.current = fromListId;
    draggingListId.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'card');
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCardDrop = async (e: React.DragEvent, toListId: number) => {
    e.preventDefault();
    setDropOverListId(null);
    if (e.dataTransfer.getData('type') !== 'card') return;

    const cardId = draggingCardId.current;
    const fromListId = draggingCardFromList.current;
    if (cardId === null || fromListId === null) return;

    // Move card to new list (append at end)
    const newBoard: Board = {
      ...board,
      lists: board.lists.map((l) => {
        if (l.id === fromListId) return { ...l, cards: l.cards.filter((c) => c.id !== cardId) };
        if (l.id === toListId) {
          const movedCard = board.lists.flatMap((x) => x.cards).find((c) => c.id === cardId);
          if (!movedCard) return l;
          const updated = { ...movedCard, list_id: toListId, position: l.cards.length };
          return { ...l, cards: [...l.cards, updated] };
        }
        return l;
      }),
    };
    onBoardChange(newBoard);
    draggingCardId.current = null;
    draggingCardFromList.current = null;

    // Persist
    try {
      const targetList = newBoard.lists.find((l) => l.id === toListId);
      if (targetList) {
        await api.patch(`/api/lists/${toListId}/cards/reorder`, {
          card_ids: targetList.cards.map((c) => c.id),
        });
      }
    } catch (err) {
      console.error('card drop persist failed', err);
    }
  };

  // ── List drag handlers ────────────────────────────────────────────────────
  const handleColDragStart = (e: React.DragEvent, listId: number) => {
    // Only start column drag if the card drag didn't just set up
    if (draggingCardId.current !== null) {
      e.preventDefault();
      return;
    }
    draggingListId.current = listId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'list');
  };

  const handleColDragOver = (e: React.DragEvent, listId: number) => {
    if (e.dataTransfer.types.includes('type') && draggingListId.current !== null) {
      setDropOverListId(listId);
    }
  };

  const handleColDrop = async (e: React.DragEvent, toListId: number) => {
    e.preventDefault();
    setDropOverListId(null);
    if (e.dataTransfer.getData('type') !== 'list') return;

    const fromListId = draggingListId.current;
    draggingListId.current = null;
    if (fromListId === null || fromListId === toListId) return;

    const ordered = [...sortedLists];
    const fromIdx = ordered.findIndex((l) => l.id === fromListId);
    const toIdx   = ordered.findIndex((l) => l.id === toListId);
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    const reordered = ordered.map((l, i) => ({ ...l, position: i }));

    onBoardChange({ ...board, lists: reordered });

    try {
      await api.patch(`/api/boards/${board.id}/lists/reorder`, {
        list_ids: reordered.map((l) => l.id),
      });
    } catch (err) {
      console.error('list reorder persist failed', err);
    }
  };

  // ── List actions ──────────────────────────────────────────────────────────
  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const { data } = await api.post(`/api/boards/${board.id}/lists`, { title: newListTitle.trim() });
      onBoardChange({ ...board, lists: [...board.lists, { ...data, cards: [] }] });
      setNewListTitle('');
      setAddingList(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardAdded = (listId: number, card: Card) => {
    onBoardChange({
      ...board,
      lists: board.lists.map((l) =>
        l.id === listId ? { ...l, cards: [...l.cards, card] } : l
      ),
    });
  };

  const handleListUpdated = (updated: List) => {
    onBoardChange({
      ...board,
      lists: board.lists.map((l) => (l.id === updated.id ? { ...l, title: updated.title } : l)),
    });
  };

  const handleListDeleted = (listId: number) => {
    onBoardChange({ ...board, lists: board.lists.filter((l) => l.id !== listId) });
  };

  return (
    <div className="kanban-board">
      {sortedLists.map((list) => (
        <KanbanColumn
          key={list.id}
          list={list}
          onCardClick={onCardClick}
          onCardAdded={handleCardAdded}
          onListUpdated={handleListUpdated}
          onListDeleted={handleListDeleted}
          onDragStart={handleCardDragStart}
          onDragOver={handleCardDragOver}
          onDropCard={handleCardDrop}
          onColDragStart={handleColDragStart}
          onColDragOver={handleColDragOver}
          onColDrop={handleColDrop}
          isDragOver={dropOverListId === list.id}
        />
      ))}

      {/* Add list */}
      {addingList ? (
        <div className="add-list-form">
          <input
            className="add-list-input"
            placeholder="List name..."
            autoFocus
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setAddingList(false); setNewListTitle(''); } }}
          />
          <div className="add-card-actions">
            <button className="btn-primary btn-sm" onClick={handleAddList}>Add list</button>
            <button className="icon-btn-xs" onClick={() => { setAddingList(false); setNewListTitle(''); }}>✕</button>
          </div>
        </div>
      ) : (
        <button className="add-list-btn" onClick={() => setAddingList(true)}>
          <Plus size={16} /> Add a list
        </button>
      )}
    </div>
  );
}
