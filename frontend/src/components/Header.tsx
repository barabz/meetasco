import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, Settings, Activity, ClipboardList, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header-bar">
      {/* Search */}
      <div className="header-search-wrap">
        <Search size={15} className="header-search-icon" />
        <input
          className="header-search"
          placeholder="Search boards, cards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="header-search-clear" onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* User bubble */}
      <div className="header-user-wrap" ref={dropdownRef}>
        <button
          className="header-avatar-btn"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          <Avatar user={user} size="sm" />
          <div className="header-user-info">
            <span className="header-user-name">{user?.full_name}</span>
            <span className="header-user-role">@{user?.username}</span>
          </div>
        </button>

        {dropdownOpen && (
          <div className="user-dropdown">
            <div className="user-dropdown-header">
              <Avatar user={user} size="md" />
              <div>
                <p className="user-dropdown-name">{user?.full_name}</p>
                <p className="user-dropdown-username">@{user?.username}</p>
              </div>
            </div>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
              <Settings size={15} />
              <span>Settings</span>
            </button>
            <button className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
              <Activity size={15} />
              <span>Activity</span>
            </button>
            <button className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
              <ClipboardList size={15} />
              <span>Tasks History</span>
            </button>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item user-dropdown-item--danger" onClick={handleLogout}>
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
