import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo">
          <div className="header-logo-icon">T</div>
          <span className="header-logo-text">TaskBoard</span>
        </div>
        <nav className="header-nav">
          <button className="nav-link active">
            <LayoutDashboard size={15} /> Boards
          </button>
        </nav>
      </div>
      <div className="header-right">
        <div className="user-chip">
          <Avatar user={user} size="sm" />
          <span className="user-chip-name">{user?.full_name}</span>
        </div>
        <button className="icon-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
