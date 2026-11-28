import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Clock, Star } from 'lucide-react';
import api from '../api/client';
import type { BoardSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2'];
const RECENT_KEY = 'taskboard_recent';
const MAX_RECENT = 6;

function getRecentBoards(): Array<{ id: number; title: string; color: string }> {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

export function trackBoardView(id: number, title: string, color: string) {
  try {
    const list = getRecentBoards().filter((b) => b.id !== id);
    list.unshift({ id, title, color });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {}
}

function BoardGrid({ boards, onNavigate }: { boards: BoardSummary[]; onNavigate: (id: number) => void }) {
  return (
    <div className="boards-grid">
      {boards.map((board) => (
        <div key={board.id} className="board-card" onClick={() => onNavigate(board.id)}>
          <div className="board-card-accent" style={{ background: board.color }} />
          <div className="board-card-body">
            <h3 className="board-card-title">{board.title}</h3>
            {board.description && <p className="board-card-desc">{board.description}</p>}
            <div className="board-card-meta">
              <span className="board-card-date">{new Date(board.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', color: '#7c3aed' });
  const [creating, setCreating] = useState(false);
  const [recentIds, setRecentIds] = useState<number[]>([]);

  useEffect(() => {
    setRecentIds(getRecentBoards().map((b) => b.id));
    api.get('/api/boards').then(({ data }) => { setBoards(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/api/boards', form);
      setBoards((b) => [...b, data]);
      setShowCreate(false);
      setForm({ title: '', description: '', color: '#7c3aed' });
      navigate(`/boards/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleNavigate = (id: number) => {
    const board = boards.find((b) => b.id === id);
    if (board) trackBoardView(board.id, board.title, board.color);
    navigate(`/boards/${id}`);
  };

  const recentBoards = recentIds
    .map((id) => boards.find((b) => b.id === id))
    .filter((b): b is BoardSummary => !!b);

  const ownBoards = boards.filter((b) => b.owner_id === user?.id);

  return (
    <Layout>
      <div className="home-page">
        {/* Your Boards */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              <Star size={18} /> Your Boards
            </h2>
          </div>

          <div className="boards-grid">
            {!showCreate ? (
              <button className="board-create-card" onClick={() => setShowCreate(true)}>
                <Plus size={28} />
                <span>Create new board</span>
              </button>
            ) : (
              <div className="board-create-form">
                <div className="board-create-header">
                  <span>New Board</span>
                  <button className="icon-btn-xs" onClick={() => setShowCreate(false)}><X size={14} /></button>
                </div>
                <input
                  className="form-input form-input-sm"
                  placeholder="Board title"
                  value={form.title}
                  autoFocus
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="color-picker">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`color-swatch${form.color === c ? ' color-swatch--selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                    />
                  ))}
                </div>
                <button className="btn-primary btn-sm" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Board'}
                </button>
              </div>
            )}

            {loading
              ? <div className="loading-state">Loading…</div>
              : <BoardGrid boards={boards} onNavigate={handleNavigate} />
            }
          </div>
        </section>

        {/* Recently Viewed */}
        {recentBoards.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">
                <Clock size={18} /> Recently Viewed
              </h2>
            </div>
            <BoardGrid boards={recentBoards} onNavigate={handleNavigate} />
          </section>
        )}

        {/* Own Boards */}
        {ownBoards.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">
                <Star size={18} /> Own Boards
              </h2>
            </div>
            <BoardGrid boards={ownBoards} onNavigate={handleNavigate} />
          </section>
        )}
      </div>
    </Layout>
  );
}
