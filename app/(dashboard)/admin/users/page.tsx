"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockDb } from '@/services/mockDb';
import { Profile, UserRole } from '@/types';
import { UserPlus, Trash2, Key, Search, User, Lock, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/calendar');
    }
  }, [user, router]);

  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'therapeute' as UserRole });
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => { setUsers(await mockDb.getProfiles()); };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.full_name) return;
    await mockDb.createUser(newUser);
    setNewUser({ username: '', password: '', full_name: '', role: 'therapeute' });
    await loadUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Supprimer cet utilisateur ?")) {
      await mockDb.deleteUser(id);
      await loadUsers();
    }
  };

  const openResetModal = (user: Profile) => {
    setSelectedUser(user);
    setResetPassword('');
    setPasswordModalOpen(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPassword) return;
    await mockDb.updateUserPassword(selectedUser.id, resetPassword);
    setPasswordModalOpen(false);
    setResetPassword('');
  };

  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Comptes & Accès</h1>
        <p className="text-slate-500 mt-1">Gérez la sécurité et les accès de votre équipe.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
            <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center space-x-3">
              <UserPlus size={24} className="text-blue-600" />
              <span>Créer un compte</span>
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom complet</label>
                <input type="text" required placeholder="Ex: Pierre Durand" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Identifiant</label>
                <input type="text" required placeholder="Ex: pierre.d" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mot de passe</label>
                <div className="relative">
                  <input type="text" required placeholder="Mot de passe" className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rôle</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                  <option value="therapeute">Thérapeute</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 mt-4">Créer le compte</button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
               <h2 className="font-bold text-xl text-slate-800">Équipe ({users.length})</h2>
               <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium" value={search} onChange={e => setSearch(e.target.value)} />
               </div>
             </div>
             <div className="divide-y divide-slate-100 overflow-y-auto max-h-[700px]">
               {filteredUsers.map(u => (
                 <div key={u.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${u.role === 'admin' ? 'bg-slate-800' : u.role === 'secretaire' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg leading-tight">{u.full_name}</p>
                        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                          <div className="flex items-center space-x-1"><User size={12} /><span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">{u.username}</span></div>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-slate-100 text-slate-800' : u.role === 'secretaire' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openResetModal(u)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Reset Password">
                        <Lock size={20} />
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Account">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                 </div>
               ))}
               {filteredUsers.length === 0 && (
                 <div className="p-12 text-center text-slate-400 font-medium">Aucun utilisateur trouvé.</div>
               )}
             </div>
          </div>
        </div>
      </div>
      <Modal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title={`Réinitialisation : ${selectedUser?.full_name}`}>
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-sm text-amber-800 leading-relaxed font-medium">
            Attention : Vous allez modifier le mot de passe de cet utilisateur. Il devra l'utiliser pour sa prochaine connexion.
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nouveau mot de passe</label>
            <div className="relative">
              <input type="text" required placeholder="Nouveau mot de passe" className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
              <Key size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-200"><Save size={20} /><span>Enregistrer les modifications</span></button>
        </form>
      </Modal>
    </div>
  );
}