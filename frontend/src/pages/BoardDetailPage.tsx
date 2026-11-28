import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { Board, Card, User } from '../types';
import api from '../api/client';
import Layout from '../components/Layout';
import KanbanBoard from '../components/KanbanBoard';
import CardModal from '../components/CardModal';
import { trackBoardView } from './HomePage';

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/boards/${id}`),
      api.get('/api/users'),
    ]).then(([boardRes, usersRes]) => {
      const b: Board = boardRes.data;
      setBoard(b);
      setUsers(usersRes.data);
      setLoading(false);
      trackBoardView(b.id, b.title, b.color);
    }).catch(() => navigate('/'));
  }, [id, navigate]);

  const handleCardUpdated = (updated: Card) => {
    setBoard((b) => {
      if (!b) return b;
      return {
        ...b,
        lists: b.lists.map((l) => ({
          ...l,
          cards: l.cards
            .filter((c) => !(c.id === updated.id && l.id !== updated.list_id))
            .map((c) => (c.id === updated.id ? updated : c))
            .concat(l.id === updated.list_id && !l.cards.find((c) => c.id === updated.id) ? [updated] : []),
        })),
      };
    });
    setSelectedCard(updated);
  };

  const handleCardDeleted = (cardId: number) => {
    setBoard((b) => {
      if (!b) return b;
      return { ...b, lists: b.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) })) };
    });
    setSelectedCard(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading board...</div>
      </Layout>
    );
  }

  if (!board) return null;

  return (
    <Layout>
      <div className="board-page" style={{ '--board-color': board.color } as React.CSSProperties}>
        <div className="board-page-header">
          <button className="btn-ghost btn-sm back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={16} /> Home
          </button>
          <div className="board-page-title-row">
            <div className="board-dot" style={{ background: board.color }} />
            <h1 className="board-page-title">{board.title}</h1>
          </div>
          {board.description && <p className="board-page-desc">{board.description}</p>}
        </div>

        <KanbanBoard
          board={board}
          onCardClick={(card) => setSelectedCard(card)}
          onBoardChange={setBoard}
        />
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          lists={board.lists}
          users={users}
          boardLabels={board.labels}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
        />
      )}
    </Layout>
  );
}
