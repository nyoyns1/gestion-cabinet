import React, { useState, useEffect, useMemo } from 'react';
import { mockDb } from '../services/mockDb';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { TrendingUp, TrendingDown, PlusCircle, Save, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

type FilterType = 'day' | 'month' | 'year';

export const Finance: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filter State
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState<TransactionType>('gain');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    method: 'TPE' as PaymentMethod,
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const data = await mockDb.getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Filtering Logic ---
  const isSamePeriod = (dateString: string) => {
    const d = new Date(dateString);
    const s = new Date(selectedDate);

    if (filterType === 'day') {
      return d.toDateString() === s.toDateString();
    }
    if (filterType === 'month') {
      return d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
    }
    if (filterType === 'year') {
      return d.getFullYear() === s.getFullYear();
    }
    return false;
  };

  const filteredTransactions = useMemo(() => 
    transactions.filter(t => isSamePeriod(t.date)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [transactions, filterType, selectedDate]);

  const summary = useMemo(() => {
    const gains = filteredTransactions.filter(t => t.type === 'gain').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'depense').reduce((acc, t) => acc + t.amount, 0);
    return { gains, expenses };
  }, [filteredTransactions]);


  const openModal = (type: TransactionType) => {
    setCurrentType(type);
    setFormData({
      amount: '',
      category: '',
      method: 'TPE',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    await mockDb.addTransaction({
      type: currentType,
      amount: parseFloat(formData.amount),
      category: formData.category,
      method: formData.method,
      date: new Date(formData.date).toISOString()
    });

    setIsModalOpen(false);
    await loadData();
  };

  const gainsList = filteredTransactions.filter(t => t.type === 'gain');
  const expensesList = filteredTransactions.filter(t => t.type === 'depense');

  // --- Date Handlers ---
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

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
            <p className="text-slate-500">Suivi de la trésorerie.</p>
         </div>

         <div className="flex items-center gap-4">
            {/* --- FILTERS BAR --- */}
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2">
              <div className="flex bg-slate-100 rounded-md p-1">
                <button 
                  onClick={() => setFilterType('day')} 
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Jour</button>
                <button 
                  onClick={() => setFilterType('month')} 
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Mois</button>
                <button 
                  onClick={() => setFilterType('year')} 
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Année</button>
              </div>

              <div className="relative">
                <CalendarIcon size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                {filterType === 'year' ? (
                  <input 
                    type="number" 
                    min="2020" max="2030"
                    value={selectedDate.getFullYear()}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(year);
                      setSelectedDate(newDate);
                    }}
                    className="pl-7 pr-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 w-20"
                  />
                ) : (
                  <input 
                    type={filterType === 'month' ? 'month' : 'date'}
                    value={formatDateInputValue()}
                    onChange={handleDateChange}
                    className="pl-7 pr-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Bénéfice Net (Période)</span>
                    <span className={`text-xl font-bold ${(summary.gains - summary.expenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(summary.gains - summary.expenses).toFixed(2)} DH
                    </span>
                  </div>
              </div>
            )}
         </div>
      </div>

      {/* Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        
        {/* GAINS - Visible only for Admin */}
        {user?.role === 'admin' && (
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-emerald-700">
                   <TrendingUp size={20} />
                   <h2 className="font-bold">Gains (Recettes)</h2>
                </div>
                <span className="font-bold text-emerald-700">{summary.gains.toFixed(2)} DH</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <button 
                  onClick={() => openModal('gain')}
                  className="w-full border-2 border-dashed border-slate-200 rounded-lg p-3 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                   <PlusCircle size={18} />
                   <span>Ajouter un gain</span>
                </button>
                
                {gainsList.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">Aucun gain sur cette période.</p>
                )}

                {gainsList.map(t => (
                   <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            {t.method.substring(0,3).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-semibold text-slate-800">{t.category}</p>
                            <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <span className="font-bold text-emerald-600">+{t.amount.toFixed(2)} DH</span>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* DÉPENSES - Visible for Admin and Secretary */}
        <div className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${user?.role !== 'admin' ? 'lg:col-span-2' : ''}`}>
           <div className="p-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-red-700">
                 <TrendingDown size={20} />
                 <h2 className="font-bold">Dépenses (Charges)</h2>
              </div>
              <span className="font-bold text-red-700">{summary.expenses.toFixed(2)} DH</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <button 
                onClick={() => openModal('depense')}
                className="w-full border-2 border-dashed border-slate-200 rounded-lg p-3 text-slate-400 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                 <PlusCircle size={18} />
                 <span>Ajouter une dépense</span>
              </button>

              {expensesList.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">Aucune dépense sur cette période.</p>
              )}

              {expensesList.map(t => (
                 <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                          {t.method.substring(0,3).toUpperCase()}
                       </div>
                       <div>
                          <p className="font-semibold text-slate-800">{t.category}</p>
                          <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <span className="font-bold text-red-600">-{t.amount.toFixed(2)} DH</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentType === 'gain' ? "Nouveau Gain" : "Nouvelle Dépense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant (DH) <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              step="0.01"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              placeholder={currentType === 'gain' ? "Ex: Consultation, Séance..." : "Ex: Loyer, Matériel..."}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moyen de paiement</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.method}
                onChange={e => setFormData({...formData, method: e.target.value as PaymentMethod})}
              >
                <option value="TPE">TPE / CB</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors mt-6
              ${currentType === 'gain' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            `}
          >
            <Save size={18} />
            <span>Enregistrer</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};