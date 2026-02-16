import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Briefcase, 
  LogOut, 
  Activity,
  ShieldAlert,
  Users
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 p-3 rounded-lg transition-colors font-medium text-sm ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 shadow-xl">
        <div className="p-6 border-b border-slate-700 bg-slate-950">
          <div className="flex items-center space-x-2">
            <Activity className="h-7 w-7 text-blue-500" />
            <span className="text-xl font-bold tracking-tight">PhysioManager</span>
          </div>
          <div className="mt-4 flex items-center space-x-3">
             <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
                {user?.full_name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{user?.role}</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">Menu</div>
          
          {user?.role === 'admin' && (
            <NavLink to="/" className={navItemClass} end>
              <LayoutDashboard size={18} />
              <span>Tableau de bord</span>
            </NavLink>
          )}
          
          <NavLink to="/calendar" className={navItemClass}>
            <Calendar size={18} />
            <span>Calendrier</span>
          </NavLink>

          <NavLink to="/patients" className={navItemClass}>
            <Users size={18} />
            <span>Patients</span>
          </NavLink>

          {(user?.role === 'admin' || user?.role === 'secretaire') && (
            <NavLink to="/finance" className={navItemClass}>
              <Briefcase size={18} />
              <span>Finance</span>
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Administration</div>
              <NavLink to="/admin/users" className={navItemClass}>
                <ShieldAlert size={18} />
                <span>Utilisateurs</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto bg-slate-50">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};