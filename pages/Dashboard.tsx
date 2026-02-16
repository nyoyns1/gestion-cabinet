import React, { useEffect, useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, TrendingUp, TrendingDown, Users, Wallet, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Appointment, Transaction } from '../types';

type FilterType = 'day' | 'month' | 'year';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);

  // Filter State
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      const apts = await mockDb.getAppointments();
      const txs = await mockDb.getTransactions();
      const pats = await mockDb.getPatients();

      setAppointments(apts);
      setTransactions(txs);
      setPatientsCount(pats.length);
    };
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

  const filteredAppointments = useMemo(() => appointments.filter(a => isSamePeriod(a.start_time)), [appointments, filterType, selectedDate]);
  const filteredTransactions = useMemo(() => transactions.filter(t => isSamePeriod(t.date)), [transactions, filterType, selectedDate]);

  // --- KPIs Calculation ---
  const kpi = useMemo(() => {
    const gains = filteredTransactions.filter(t => t.type === 'gain').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'depense').reduce((acc, t) => acc + t.amount, 0);
    const net = gains - expenses;
    const pending = filteredAppointments.filter(a => a.status === 'En attente').length;

    return {
      appointmentsCount: filteredAppointments.length,
      netProfit: net,
      pendingCount: pending
    };
  }, [filteredAppointments, filteredTransactions]);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { name: string, gain: number, depense: number, sortKey: number }>();

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      let name = '';
      let sortKey = 0;

      if (filterType === 'year') {
        key = `${date.getMonth()}`;
        name = date.toLocaleDateString('fr-FR', { month: 'short' });
        sortKey = date.getMonth();
      } else if (filterType === 'month') {
        key = `${date.getDate()}`;
        name = `${date.getDate()}`;
        sortKey = date.getDate();
      } else {
        // Day view: Group by hour? Or just show list? Let's group by hour for the chart
        key = `${date.getHours()}`;
        name = `${date.getHours()}h`;
        sortKey = date.getHours();
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { name, gain: 0, depense: 0, sortKey });
      }

      const entry = dataMap.get(key)!;
      if (t.type === 'gain') entry.gain += t.amount;
      else entry.depense += t.amount;
    });

    // Fill missing gaps for aesthetic charts (optional, simple sort here)
    return Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredTransactions, filterType]);

  // --- Handlers ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    setSelectedDate(new Date(e.target.value));
  };

  const formatDateInputValue = () => {
    const d = selectedDate;
    if (filterType === 'day') return d.toISOString().split('T')[0];
    if (filterType === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (filterType === 'year') return `${d.getFullYear()}-01-01`; // Dummy for type="date", usually handled by custom logic, but using number input is easier for year
    return '';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble et statistiques.</p>
        </div>

        {/* --- FILTERS BAR --- */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2">
           <div className="flex bg-slate-100 rounded-md p-1">
             <button 
               onClick={() => setFilterType('day')} 
               className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${filterType === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >Jour</button>
             <button 
               onClick={() => setFilterType('month')} 
               className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${filterType === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >Mois</button>
             <button 
               onClick={() => setFilterType('year')} 
               className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${filterType === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >Année</button>
           </div>

           <div className="h-6 w-px bg-slate-200 mx-2"></div>

           <div className="relative">
             <CalendarIcon size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
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
                  className="pl-8 pr-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 w-24"
                />
             ) : (
                <input 
                  type={filterType === 'month' ? 'month' : 'date'}
                  value={formatDateInputValue()}
                  onChange={handleDateChange}
                  className="pl-8 pr-2 py-1 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                />
             )}
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">RDV ({filterType === 'year' ? 'Année' : filterType === 'month' ? 'Mois' : 'Jour'})</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{kpi.appointmentsCount}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarCheck size={24} />
            </div>
          </div>
        </div>

        {(user?.role === 'admin' || user?.role === 'secretaire') && (
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-sm font-medium text-slate-500">Bénéfice Net</p>
                 <h3 className={`text-3xl font-bold mt-2 ${kpi.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                   {kpi.netProfit > 0 ? '+' : ''}{kpi.netProfit} DH
                 </h3>
               </div>
               <div className={`p-3 rounded-lg ${kpi.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                 {kpi.netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
               </div>
             </div>
           </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients Actifs</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{patientsCount}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">RDV en attente (Période)</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{kpi.pendingCount}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center justify-between">
            <span>Évolution Financière</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {filterType === 'year' ? 'Par mois' : filterType === 'month' ? 'Par jour' : 'Par heure'}
            </span>
          </h3>
          
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDepense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value: number) => [`${value} DH`, '']}
                  />
                  <Area type="monotone" dataKey="gain" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGain)" name="Gains" />
                  <Area type="monotone" dataKey="depense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDepense)" name="Dépenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400 italic">
              Aucune donnée financière pour cette période.
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">PhysioManager Pro</h3>
            <p className="text-slate-400 text-sm">
              Votre bénéfice net est de <span className="text-white font-bold">{kpi.netProfit} DH</span> sur cette période.
            </p>
          </div>
          <button className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition w-full mt-6">
            Générer Rapport PDF
          </button>
          {/* Decorative circles */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>
          <div className="absolute top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
};