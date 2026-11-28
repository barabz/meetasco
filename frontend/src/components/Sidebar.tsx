import { NavLink } from 'react-router-dom';
import { Home, Calendar } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">T</div>
        <span className="sidebar-logo-text">TaskBoard</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <Home size={18} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <Calendar size={18} />
          <span>Calendar</span>
        </NavLink>
      </nav>
    </aside>
  );
}
