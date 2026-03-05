"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { mockDb } from '@/services/mockDb';
import { Transaction, TransactionType, PaymentMethod } from '@/types';
import { TrendingUp, TrendingDown, PlusCircle, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

type FilterType = 'day' | 'month' | 'year';

export default function FinancePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user && user.role === 'therapeute') {
      router.push('/calendar');
    }
  }, [user, router]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState<TransactionType>('gain');
  const [formData, setFormData] = useState({ amount: '', category: '', method: 'TPE' as PaymentMethod, date: new Date().toISOString().split('T')[0] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { setTransactions(await mockDb.getTransactions()); };

  const isSamePeriod = (dateString: string) => {
    const d = new Date(dateString);
    const s = new Date(selectedDate);
    if (filterType === 'day') return d.toDateString() === s.toDateString();
    if (filterType === 'month') return d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
    if (filterType === 'year') return d.getFullYear() === s.getFullYear();
    return false;
  };

  const filteredTransactions = useMemo(() => transactions.filter(t => isSamePeriod(t.date)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions, filterType, selectedDate]);
  
  const summary = useMemo(() => {
    const gains = filteredTransactions.filter(t => t.type === 'gain').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'depense').reduce((acc, t) => acc + t.amount, 0);
    return { gains, expenses };
  }, [filteredTransactions]);

  const openModal = (type: TransactionType) => {
    setCurrentType(type);
    setFormData({ amount: '', category: '', method: 'TPE', date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    await mockDb.addTransaction({
      type: currentType, amount: parseFloat(formData.amount), category: formData.category, method: formData.method, date: new Date(formData.date).toISOString()
    });
    setIsModalOpen(false);
    await loadData();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    setSelectedDate(new Date(e.target.value));
  };

  const formatDateInputValue = () => {
    const d = selectedDate;
    if (filterType === 'day') return d.toISOString().split('T')[0];
    if (filterType === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (filterType === 'year') return `${d.getFullYear()}-01-01`; 
    return '';
  };

  if (user?.role === 'therapeute') return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
         <div>
            <h1 className="text-3xl font-bold text-slate-900">Finance & Trésorerie</h1>
            <p className="text-slate-500 mt-1">Suivez les revenus et dépenses du cabinet.</p>
         </div>
         <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => setFilterType('day')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Jour</button>
                <button onClick={() => setFilterType('month')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mois</button>
                <button onClick={() => setFilterType('year')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Année</button>
              </div>
              <div className="relative">
                <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                {filterType === 'year' ? (
                  <input type="number" min="2020" max="2030" value={selectedDate.getFullYear()} onChange={(e) => { const newDate = new Date(selectedDate); newDate.setFullYear(parseInt(e.target.value)); setSelectedDate(newDate); }} className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-24 font-medium" />
                ) : (
                  <input type={filterType === 'month' ? 'month' : 'date'} value={formatDateInputValue()} onChange={handleDateChange} className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                )}
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest">Bénéfice Net</span>
                  <span className={`text-2xl font-black ${(summary.gains - summary.expenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(summary.gains - summary.expenses).toLocaleString('fr-FR')} DH
                  </span>
                </div>
              </div>
            )}
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {user?.role === 'admin' && (
          <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-center">
               <div className="flex items-center space-x-3 text-emerald-700 font-bold">
                 <TrendingUp size={24} />
                 <h2 className="text-lg uppercase tracking-tight">Recettes</h2>
               </div>
               <span className="font-black text-xl text-emerald-700">{summary.gains.toLocaleString('fr-FR')} DH</span>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <button onClick={() => openModal('gain')} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2 font-bold group">
                  <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Enregistrer une recette</span>
                </button>
                {filteredTransactions.filter(t => t.type === 'gain').map(t => (
                   <div key={t.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl group transition-all border border-transparent hover:border-slate-100 shadow-sm bg-white">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs shadow-inner uppercase">{t.method.substring(0,3)}</div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{t.category}</p>
                          <p className="text-xs text-slate-400 font-medium mt-1">{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-600">+{t.amount.toLocaleString('fr-FR')} DH</span>
                   </div>
                ))}
             </div>
          </div>
        )}

        <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${user?.role !== 'admin' ? 'lg:col-span-2' : ''}`}>
           <div className="p-6 border-b border-slate-100 bg-red-50/30 flex justify-between items-center">
             <div className="flex items-center space-x-3 text-red-700 font-bold">
               <TrendingDown size={24} />
               <h2 className="text-lg uppercase tracking-tight">Dépenses</h2>
             </div>
             <span className="font-black text-xl text-red-700">{summary.expenses.toLocaleString('fr-FR')} DH</span>
           </div>
           <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <button onClick={() => openModal('depense')} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-slate-400 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center space-x-2 font-bold group">
                <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span>Enregistrer une dépense</span>
              </button>
              {filteredTransactions.filter(t => t.type === 'depense').map(t => (
                 <div key={t.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl group transition-all border border-transparent hover:border-slate-100 shadow-sm bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shadow-inner uppercase">{t.method.substring(0,3)}</div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{t.category}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                      </div>
                    </div>
                    <span className="font-black text-red-600">-{t.amount.toLocaleString('fr-FR')} DH</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentType === 'gain' ? "Nouvelle Recette" : "Nouvelle Charge"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Montant *</label>
            <div className="relative">
              <input type="number" step="0.01" required className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg text-slate-900" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">DH</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Catégorie / Motif *</label>
            <input type="text" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Matériel, Loyer, Séance..." />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Moyen</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium appearance-none" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value as PaymentMethod})}>
                <option value="TPE">TPE / CB</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
              <input type="date" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
          <button type="submit" className={`w-full text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 mt-4 ${currentType === 'gain' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
            <Save size={20} />
            <span>Enregistrer la transaction</span>
          </button>
        </form>
      </Modal>
    </div>
  );
}