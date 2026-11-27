import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import api from '../api/client';
import type { BoardSummary } from '../types';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2'];

export default function BoardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', color: '#7c3aed' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
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

  return (
    <div className="app-layout">
      <Header />
      <main className="boards-page">
        <div className="boards-hero">
          <h1 className="boards-title">Your Boards</h1>
          <p className="boards-subtitle">Manage projects and track team progress</p>
        </div>

        <div className="boards-grid">
          {/* Create board card */}
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
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
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
                    className={`color-swatch ${form.color === c ? 'color-swatch--selected' : ''}`}
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

          {/* Board cards */}
          {boards.map((board) => (
            <div
              key={board.id}
              className="board-card"
              onClick={() => navigate(`/boards/${board.id}`)}
              style={{ '--board-color': board.color } as any}
            >
              <div className="board-card-accent" style={{ background: board.color }} />
              <div className="board-card-body">
                <h3 className="board-card-title">{board.title}</h3>
                {board.description && (
                  <p className="board-card-desc">{board.description}</p>
                )}
                <div className="board-card-meta">
                  <span className="board-card-date">
                    {new Date(board.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="loading-state">Loading boards…</div>
        )}
        {!loading && boards.length === 0 && (
          <div className="empty-state">
            <p>No boards yet. Create one to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}
