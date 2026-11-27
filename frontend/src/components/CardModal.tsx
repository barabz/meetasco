import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Check, MessageSquare, Send, Pencil } from 'lucide-react';
import type { Card, User, List, Label, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { format, parseISO } from 'date-fns';

interface Props {
  card: Card;
  lists: List[];
  users: User[];
  boardLabels: Label[];
  onClose: () => void;
  onUpdated: (card: Card) => void;
  onDeleted: (cardId: number) => void;
}

const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#475569',
];

export default function CardModal({ card, lists, users, boardLabels, onClose, onUpdated, onDeleted }: Props) {
  const { user: me } = useAuth();
  const [title, setTitle]       = useState(card.title);
  const [desc, setDesc]         = useState(card.description);
  const [deadline, setDeadline] = useState(card.deadline ? card.deadline.slice(0, 16) : '');
  const [completed, setCompleted] = useState(card.is_completed);
  const [listId, setListId]     = useState(card.list_id);
  const [saving, setSaving]     = useState(false);

  // Labels state (local copy of which labels are on this card)
  const [cardLabelIds, setCardLabelIds] = useState<number[]>(card.labels.map((l) => l.id));
  // Members state
  const [memberIds, setMemberIds] = useState<number[]>(card.members.map((u) => u.id));

  // Comments
  const [comments, setComments]     = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCid, setEditingCid] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);

  // Label picker
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState(LABEL_COLORS[0]);
  const [pickerName, setPickerName]   = useState('');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [allLabels, setAllLabels] = useState<Label[]>(boardLabels);

  useEffect(() => {
    api.get(`/api/cards/${card.id}/comments`).then(({ data }) => setComments(data));
  }, [card.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/cards/${card.id}`, {
        title: title.trim() || card.title,
        description: desc,
        deadline: deadline || null,
        is_completed: completed,
        list_id: listId,
      });
      onUpdated(data);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;
    await api.delete(`/api/cards/${card.id}`);
    onDeleted(card.id);
  };

  // ── Label toggle ────────────────────────────────────────────────────────
  const toggleCardLabel = async (labelId: number) => {
    if (cardLabelIds.includes(labelId)) {
      await api.delete(`/api/cards/${card.id}/labels/${labelId}`);
      setCardLabelIds((prev) => prev.filter((id) => id !== labelId));
    } else {
      await api.post(`/api/cards/${card.id}/labels/${labelId}`);
      setCardLabelIds((prev) => [...prev, labelId]);
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel) return;
    const { data } = await api.put(`/api/labels/${editingLabel.id}`, { color: pickerColor, name: pickerName });
    setAllLabels((prev) => prev.map((l) => (l.id === editingLabel.id ? data : l)));
    setEditingLabel(null);
    setPickerName('');
  };

  const handleDeleteLabel = async (labelId: number) => {
    await api.delete(`/api/labels/${labelId}`);
    setAllLabels((prev) => prev.filter((l) => l.id !== labelId));
    setCardLabelIds((prev) => prev.filter((id) => id !== labelId));
  };

  // ── Member toggle ────────────────────────────────────────────────────────
  const toggleMember = async (userId: number) => {
    if (memberIds.includes(userId)) {
      await api.delete(`/api/cards/${card.id}/members/${userId}`);
      setMemberIds((prev) => prev.filter((id) => id !== userId));
    } else {
      await api.post(`/api/cards/${card.id}/members/${userId}`);
      setMemberIds((prev) => [...prev, userId]);
    }
  };

  // ── Comments ─────────────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { data } = await api.post(`/api/cards/${card.id}/comments`, { content: newComment.trim() });
    setComments((prev) => [...prev, data]);
    setNewComment('');
    setTimeout(() => commentsRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    const { data } = await api.put(`/api/comments/${commentId}`, { content: editContent.trim() });
    setComments((prev) => prev.map((c) => (c.id === commentId ? data : c)));
    setEditingCid(null);
  };

  const handleDeleteComment = async (commentId: number) => {
    await api.delete(`/api/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const boardId = allLabels[0]?.board_id ?? lists.find((l) => l.id === card.list_id)?.board_id ?? 0;

  const handleCreateLabelFixed = async () => {
    if (!pickerColor || !boardId) return;
    const { data } = await api.post(`/api/boards/${boardId}/labels`, { color: pickerColor, name: pickerName });
    setAllLabels((prev) => [...prev, data]);
    setPickerName('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container card-modal">
        {/* Header */}
        <div className="modal-header">
          <input
            className="modal-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Left column */}
          <div className="modal-main">
            {/* Completed + move */}
            <div className="modal-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
                Mark as completed
              </label>
            </div>

            <div className="modal-field">
              <label className="field-label">Description</label>
              <textarea
                className="modal-textarea"
                rows={4}
                placeholder="Add a description..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label className="field-label">Deadline</label>
              <input
                type="datetime-local"
                className="modal-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label className="field-label">Move to list</label>
              <select className="modal-select" value={listId} onChange={(e) => setListId(Number(e.target.value))}>
                {lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>

            {/* Comments */}
            <div className="modal-field">
              <label className="field-label">
                <MessageSquare size={14} style={{ marginRight: 6 }} />
                Comments ({comments.length})
              </label>
              <div className="comments-list" ref={commentsRef}>
                {comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div
                      className="comment-avatar"
                      style={{ backgroundColor: c.author.avatar_color }}
                    >
                      {c.author.full_name[0].toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-author">{c.author.full_name}</span>
                        <span className="comment-time">
                          {format(parseISO(c.created_at), 'MMM d, h:mm a')}
                        </span>
                        {me?.id === c.author_id && (
                          <div className="comment-actions">
                            <button className="comment-action-btn" onClick={() => { setEditingCid(c.id); setEditContent(c.content); }}>
                              <Pencil size={12} />
                            </button>
                            <button className="comment-action-btn danger" onClick={() => handleDeleteComment(c.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingCid === c.id ? (
                        <div className="comment-edit">
                          <textarea
                            className="comment-textarea"
                            value={editContent}
                            autoFocus
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditComment(c.id); } if (e.key === 'Escape') setEditingCid(null); }}
                          />
                          <div className="comment-edit-actions">
                            <button className="btn-primary btn-xs" onClick={() => handleEditComment(c.id)}>Save</button>
                            <button className="btn-ghost btn-xs" onClick={() => setEditingCid(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="comment-content">{c.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="comment-compose">
                <div
                  className="comment-avatar"
                  style={{ backgroundColor: me?.avatar_color ?? '#7c3aed' }}
                >
                  {me?.full_name[0].toUpperCase() ?? '?'}
                </div>
                <div className="comment-input-wrap">
                  <textarea
                    className="comment-textarea"
                    placeholder="Write a comment..."
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  />
                  <button className="comment-send-btn" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="modal-sidebar">
            {/* Labels */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span className="field-label">Labels</span>
                <button className="sidebar-add-btn" onClick={() => setShowLabelPicker((v) => !v)}>
                  {showLabelPicker ? 'Done' : '+ New'}
                </button>
              </div>

              {/* Existing board labels */}
              <div className="label-list">
                {allLabels.map((label) => (
                  <div key={label.id} className="label-row">
                    <button
                      className={`label-toggle${cardLabelIds.includes(label.id) ? ' active' : ''}`}
                      style={{ '--label-color': label.color } as React.CSSProperties}
                      onClick={() => toggleCardLabel(label.id)}
                    >
                      {cardLabelIds.includes(label.id) && <Check size={12} className="label-check" />}
                      <span className="label-swatch" style={{ backgroundColor: label.color }} />
                      <span className="label-name">{label.name || <em>Unnamed</em>}</span>
                    </button>
                    <button className="label-edit-btn" onClick={() => { setEditingLabel(label); setPickerColor(label.color); setPickerName(label.name); setShowLabelPicker(true); }}>
                      <Pencil size={11} />
                    </button>
                    <button className="label-edit-btn danger" onClick={() => handleDeleteLabel(label.id)}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Label picker */}
              {showLabelPicker && (
                <div className="label-picker">
                  <p className="picker-hint">{editingLabel ? 'Edit label' : 'Create label'}</p>
                  <div className="color-grid">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`color-swatch${pickerColor === c ? ' selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setPickerColor(c)}
                      />
                    ))}
                  </div>
                  <input
                    className="modal-input"
                    placeholder="Label name (optional)"
                    value={pickerName}
                    onChange={(e) => setPickerName(e.target.value)}
                  />
                  <div className="picker-actions">
                    {editingLabel ? (
                      <>
                        <button className="btn-primary btn-sm" onClick={handleUpdateLabel}>Update</button>
                        <button className="btn-ghost btn-sm" onClick={() => { setEditingLabel(null); setPickerName(''); }}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn-primary btn-sm" onClick={handleCreateLabelFixed}>Create label</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="sidebar-section">
              <span className="field-label">Members</span>
              <div className="member-list">
                {users.map((u) => (
                  <button
                    key={u.id}
                    className={`member-row${memberIds.includes(u.id) ? ' active' : ''}`}
                    onClick={() => toggleMember(u.id)}
                  >
                    <div className="member-avatar" style={{ backgroundColor: u.avatar_color }}>
                      {u.full_name[0].toUpperCase()}
                    </div>
                    <span className="member-name">{u.full_name}</span>
                    {memberIds.includes(u.id) && <Check size={14} className="member-check" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} /> Delete card
          </button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
