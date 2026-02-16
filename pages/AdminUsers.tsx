import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { Profile, UserRole } from '../types';
import { Shield, UserPlus, Trash2, Key, Search, User, Lock, Save } from 'lucide-react';
import { Modal } from '../components/Modal';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  
  // Create User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'therapeute' as UserRole
  });

  // Reset Password State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await mockDb.getProfiles();
    setUsers(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.full_name) return;

    await mockDb.createUser(newUser);
    
    // Reset and reload
    setNewUser({ username: '', password: '', full_name: '', role: 'therapeute' });
    await loadUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
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
    // On pourrait ajouter un toast de succès ici
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comptes & Accès</h1>
        <p className="text-slate-500">Créez et gérez les comptes utilisateurs du cabinet.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULAIRE DE CRÉATION */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center space-x-2">
              <UserPlus size={20} className="text-blue-600" />
              <span>Créer un compte</span>
            </h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom complet</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Pierre Durand"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUser.full_name}
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Identifiant (Login)</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: pierre.d"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    placeholder="Mot de passe"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                  <Key size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rôle</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                >
                  <option value="therapeute">Thérapeute</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold shadow-md transition-all active:scale-95 mt-2"
              >
                Créer l'utilisateur
              </button>
            </form>
          </div>
        </div>

        {/* LISTE DES UTILISATEURS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
               <h2 className="font-bold text-slate-800">Personnel ({users.length})</h2>
               <div className="relative w-48">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                 />
               </div>
             </div>
             
             <div className="divide-y divide-slate-100">
               {filteredUsers.map(user => (
                 <div key={user.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                         ${user.role === 'admin' ? 'bg-slate-800' : 
                           user.role === 'secretaire' ? 'bg-purple-500' : 'bg-blue-500'}
                       `}>
                          {user.full_name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-semibold text-slate-800">{user.full_name}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                             <User size={12} />
                             <span className="font-mono bg-slate-100 px-1 rounded">{user.username}</span>
                             <span>•</span>
                             <span className="capitalize">{user.role}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      
                      <button 
                        onClick={() => openResetModal(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Changer le mot de passe"
                      >
                        <Lock size={18} />
                      </button>

                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      
                      {user.role === 'admin' && (
                        <span className="text-xs text-slate-400 italic px-2">Principal</span>
                      )}
                    </div>
                 </div>
               ))}
               
               {filteredUsers.length === 0 && (
                 <div className="p-8 text-center text-slate-400 italic">
                   Aucun utilisateur trouvé.
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* MODAL CHANGEMENT DE MOT DE PASSE */}
      <Modal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)}
        title={`Modifier le mot de passe : ${selectedUser?.full_name}`}
      >
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-yellow-800 mb-4">
            Vous êtes sur le point de modifier le mot de passe de cet utilisateur. L'ancien mot de passe ne sera plus valide.
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input 
                type="text" 
                required
                placeholder="Entrez le nouveau mot de passe"
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
              />
              <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors mt-2"
          >
            <Save size={18} />
            <span>Enregistrer le nouveau mot de passe</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};