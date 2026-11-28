import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-right">
        <Header />
        <div className="app-main">
          {children}
        </div>
      </div>
    </div>
  );
}
