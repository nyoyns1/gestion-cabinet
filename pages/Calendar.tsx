import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { Appointment, Profile, Patient, TreatmentType, PaymentMethod } from '../types';
import { ChevronLeft, ChevronRight, Filter, Plus, User, Clock, Calendar as CalendarIcon, Save, CreditCard, CheckCircle, Trash2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

export const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterTherapist, setFilterTherapist] = useState<string>('all');

  // Permissions : Admin et Secrétaire peuvent éditer. Thérapeute en lecture seule.
  const canEdit = user?.role !== 'therapeute';

  // --- State: Nouveau RDV ---
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    therapistId: '',
    type: 'consultation' as TreatmentType,
    date: '',
    time: '09:00',
    duration: 30
  });

  // --- State: Paiement / Édition ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'TPE' as PaymentMethod
  });

  // Helper pour obtenir le Lundi de la semaine courante
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustement si Dimanche
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const startOfWeek = getStartOfWeek(currentDate);

  // Générer les 6 jours de la semaine (Lun-Sam)
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const loadData = async () => {
    const apts = await mockDb.getAppointments();
    const pros = await mockDb.getProfiles();
    const pats = await mockDb.getPatients();
    setAppointments(apts);
    setProfiles(pros.filter(p => p.role === 'therapeute'));
    setPatients(pats);
  };

  useEffect(() => {
    loadData();
  }, [currentDate]); 

  // Filtrage global (Thérapeute)
  const filteredAppointments = appointments.filter(apt => {
    if (filterTherapist !== 'all' && apt.therapistId !== filterTherapist) return false;
    return true;
  });

  const timeSlots = Array.from({ length: 11 }, (_, i) => 8 + i); // 8h - 18h

  // Récupérer les RDV pour une cellule spécifique (Jour + Heure)
  const getAptsForSlot = (dayDate: Date, hour: number) => {
    return filteredAppointments.filter(a => {
      const aDate = new Date(a.start_time);
      return (
        aDate.getDate() === dayDate.getDate() &&
        aDate.getMonth() === dayDate.getMonth() &&
        aDate.getFullYear() === dayDate.getFullYear() &&
        aDate.getHours() === hour
      );
    });
  };

  const changeWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  // Ouvrir modale création (Clic sur une cellule vide)
  const openNewAppointmentModal = (dayDate?: Date, hour?: number) => {
    if (!canEdit) return;

    const d = dayDate ? dayDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const t = hour ? `${hour.toString().padStart(2, '0')}:00` : '09:00';
    
    setNewAppointment({
      patientId: patients.length > 0 ? patients[0].id : '',
      therapistId: user?.role === 'therapeute' ? user.id : (profiles[0]?.id || ''),
      type: 'consultation',
      date: d,
      time: t,
      duration: 30
    });
    setIsNewModalOpen(true);
  };

  // Ouvrir modale paiement (clic sur RDV existant)
  const openPaymentModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setPaymentData({
      amount: apt.price || 0,
      method: 'TPE'
    });
    setIsPaymentModalOpen(true);
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!newAppointment.patientId || !newAppointment.therapistId) return;

    const start = new Date(`${newAppointment.date}T${newAppointment.time}`);
    const end = new Date(start.getTime() + newAppointment.duration * 60000);
    
    const patient = patients.find(p => p.id === newAppointment.patientId);
    const therapist = profiles.find(p => p.id === newAppointment.therapistId);
    
    let defaultPrice = 30;
    if (newAppointment.type === 'ostéopathie') defaultPrice = 60;
    if (newAppointment.type === 'ondes de choc') defaultPrice = 45;
    if (newAppointment.type === 'nutrition') defaultPrice = 50;

    await mockDb.addAppointment({
      patientId: newAppointment.patientId,
      patientName: patient?.name || 'Inconnu',
      therapistId: newAppointment.therapistId,
      therapistName: therapist?.full_name || 'Inconnu',
      type_soin: newAppointment.type,
      status: 'En attente', 
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      price: defaultPrice
    });

    setIsNewModalOpen(false);
    await loadData();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!selectedAppointment) return;

    await mockDb.addTransaction({
      type: 'gain',
      category: `Séance ${selectedAppointment.type_soin} - ${selectedAppointment.patientName}`,
      amount: Number(paymentData.amount),
      method: paymentData.method,
      date: new Date().toISOString()
    });

    await mockDb.updateAppointmentStatus(selectedAppointment.id, 'Effectué');

    setIsPaymentModalOpen(false);
    await loadData();
  };

  const handleCancelAppointment = async () => {
    if (!canEdit) return;
    if (!selectedAppointment) return;
    if (confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) {
      await mockDb.updateAppointmentStatus(selectedAppointment.id, 'Annulé');
      setIsPaymentModalOpen(false);
      await loadData();
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header et Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Planning Hebdomadaire</h1>
           <p className="text-slate-500">
             {canEdit ? 'Gestion du planning semaine.' : 'Visualisation du planning semaine.'}
           </p>
        </div>

        <div className="flex items-center space-x-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-slate-50 rounded-md text-slate-600"><ChevronLeft size={20}/></button>
           <div className="flex flex-col items-center w-56">
             <span className="text-sm font-bold text-slate-800 uppercase">
                Semaine du {startOfWeek.getDate()} {startOfWeek.toLocaleDateString('fr-FR', { month: 'short' })}
             </span>
             <span className="text-xs text-slate-400 font-medium">
               {startOfWeek.getFullYear()}
             </span>
           </div>
           <button onClick={() => changeWeek(1)} className="p-2 hover:bg-slate-50 rounded-md text-slate-600"><ChevronRight size={20}/></button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
             <select 
               className="appearance-none bg-white border border-slate-200 pl-9 pr-8 py-2 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
               value={filterTherapist}
               onChange={(e) => setFilterTherapist(e.target.value)}
             >
               <option value="all">Tous les thérapeutes</option>
               {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
             </select>
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          
          {canEdit && (
            <button 
              onClick={() => openNewAppointmentModal(new Date(), 9)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition shadow-sm active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">RDV Rapide</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendrier Semaine Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto">
         <div className="min-w-[1000px] h-full flex flex-col">
           {/* Header Row (Jours) */}
           <div className="flex border-b border-slate-200 sticky top-0 z-20 bg-slate-50">
             <div className="w-16 flex-shrink-0 py-3 text-center text-xs font-bold text-slate-400 border-r border-slate-200 bg-slate-50">
               HEURE
             </div>
             {weekDays.map((day, index) => (
               <div key={index} className={`flex-1 py-3 text-center border-r border-slate-200 last:border-r-0 ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50/50' : ''}`}>
                 <span className="block text-xs font-bold text-slate-500 uppercase">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                 <span className={`inline-block w-7 h-7 leading-7 rounded-full text-sm font-bold mt-1 ${day.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800'}`}>
                   {day.getDate()}
                 </span>
               </div>
             ))}
           </div>

           {/* Body Rows (Heures) */}
           <div className="flex-1 overflow-y-auto">
             {timeSlots.map(hour => (
               <div key={hour} className="flex min-h-[100px] border-b border-slate-100 last:border-b-0">
                 {/* Colonne Heure */}
                 <div className="w-16 flex-shrink-0 flex items-center justify-center border-r border-slate-100 bg-slate-50/30 text-xs font-medium text-slate-400">
                   {hour}:00
                 </div>

                 {/* Cellules Jours */}
                 {weekDays.map((day, dayIndex) => {
                   const slotApts = getAptsForSlot(day, hour);
                   const isToday = day.toDateString() === new Date().toDateString();

                   return (
                     <div 
                        key={dayIndex} 
                        className={`flex-1 border-r border-slate-100 last:border-r-0 p-1 relative group transition-colors 
                          ${canEdit ? 'hover:bg-slate-50' : ''} 
                          ${isToday ? 'bg-blue-50/10' : ''}
                        `}
                        onClick={() => canEdit && slotApts.length === 0 && openNewAppointmentModal(day, hour)}
                     >
                        {/* Bouton Ajouter (+) au survol si vide */}
                        {canEdit && slotApts.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                             <Plus className="text-blue-200" size={24} />
                          </div>
                        )}

                        {/* Liste des RDV dans ce créneau */}
                        <div className="flex flex-col gap-1 h-full">
                          {slotApts.map(apt => (
                            <div 
                              key={apt.id}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                openPaymentModal(apt); 
                              }}
                              className={`
                                p-1.5 rounded border-l-2 shadow-sm cursor-pointer hover:shadow-md transition-all bg-white text-xs relative overflow-hidden
                                ${apt.status === 'Confirmé' ? 'border-blue-500' : ''}
                                ${apt.status === 'Effectué' ? 'border-emerald-500 bg-emerald-50/30' : ''}
                                ${apt.status === 'En attente' ? 'border-amber-500' : ''}
                                ${apt.status === 'Annulé' ? 'border-red-500 bg-red-50/50 opacity-60 grayscale' : ''}
                              `}
                            >
                               <div className="flex justify-between items-start">
                                  <span className="font-bold text-slate-700 truncate">{apt.patientName.split(' ')[0]}</span>
                                  {apt.status === 'Effectué' && <CheckCircle size={10} className="text-emerald-500 mt-0.5" />}
                               </div>
                               <div className="text-[10px] text-slate-500 truncate">{apt.type_soin}</div>
                               <div className="mt-1 flex items-center space-x-1 text-[9px] text-slate-400">
                                  <User size={8} />
                                  <span className="truncate">{apt.therapistName.split(' ')[0]}</span>
                               </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   );
                 })}
               </div>
             ))}
           </div>
         </div>
      </div>

      {/* --- MODAL 1: Nouveau RDV --- */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nouveau Rendez-vous"
      >
        <form onSubmit={handleNewSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newAppointment.patientId}
              onChange={e => setNewAppointment({...newAppointment, patientId: e.target.value})}
            >
              <option value="">Sélectionner un patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {patients.length === 0 && (
               <p className="text-xs text-red-500 mt-1">Aucun patient. Ajoutez d'abord un patient.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thérapeute</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newAppointment.therapistId}
              onChange={e => setNewAppointment({...newAppointment, therapistId: e.target.value})}
              disabled={user?.role === 'therapeute'}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de soin</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none capitalize"
              value={newAppointment.type}
              onChange={e => setNewAppointment({...newAppointment, type: e.target.value as TreatmentType})}
            >
              <option value="consultation">Consultation</option>
              <option value="tecartherapie">Tecarthérapie</option>
              <option value="ondes de choc">Ondes de choc</option>
              <option value="ostéopathie">Ostéopathie</option>
              <option value="kinésithérapie classique">Kiné Classique</option>
              <option value="réathlétisation">Réathlétisation</option>
              <option value="renforcement">Renforcement</option>
              <option value="nutrition">Nutrition</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newAppointment.date}
                onChange={e => setNewAppointment({...newAppointment, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heure</label>
              <input
                type="time"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newAppointment.time}
                onChange={e => setNewAppointment({...newAppointment, time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Durée (min)</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newAppointment.duration}
              onChange={e => setNewAppointment({...newAppointment, duration: parseInt(e.target.value)})}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1h</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors mt-6"
          >
            <Save size={18} />
            <span>Confirmer le RDV</span>
          </button>
        </form>
      </Modal>

      {/* --- MODAL 2: Paiement / Détail (Lecture seule pour Thérapeute) --- */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={canEdit ? "Règlement de séance" : "Détails du rendez-vous"}
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex justify-between mb-2">
                 <span className="text-sm text-slate-500">Patient</span>
                 <span className="font-semibold text-slate-800">{selectedAppointment.patientName}</span>
               </div>
               <div className="flex justify-between mb-2">
                 <span className="text-sm text-slate-500">Soin</span>
                 <span className="font-semibold text-slate-800 capitalize">{selectedAppointment.type_soin}</span>
               </div>
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm text-slate-500">Thérapeute</span>
                 <span className="font-semibold text-slate-800">{selectedAppointment.therapistName}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-500">Statut actuel</span>
                 <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase
                    ${selectedAppointment.status === 'Confirmé' ? 'bg-blue-100 text-blue-700' : ''}
                    ${selectedAppointment.status === 'Effectué' ? 'bg-emerald-100 text-emerald-700' : ''}
                    ${selectedAppointment.status === 'En attente' ? 'bg-amber-100 text-amber-700' : ''}
                    ${selectedAppointment.status === 'Annulé' ? 'bg-red-100 text-red-700' : ''}
                 `}>{selectedAppointment.status}</span>
               </div>
            </div>

            {canEdit ? (
              // VUE ÉDITION / PAIEMENT (Secrétaire / Admin)
              <form onSubmit={handlePaymentSubmit}>
                {selectedAppointment.status !== 'Effectué' && selectedAppointment.status !== 'Annulé' && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Montant (DH)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700"
                            value={paymentData.amount}
                            onChange={e => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">DH</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Moyen de paiement</label>
                        <select 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={paymentData.method}
                          onChange={e => setPaymentData({...paymentData, method: e.target.value as PaymentMethod})}
                        >
                          <option value="TPE">TPE / CB</option>
                          <option value="Espèces">Espèces</option>
                          <option value="Chèque">Chèque</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-200"
                    >
                      <CreditCard size={20} />
                      <span>Encaisser {paymentData.amount} DH</span>
                    </button>
                  </>
                )}

                {selectedAppointment.status === 'Effectué' && (
                  <div className="text-center py-4 text-emerald-600 font-medium flex flex-col items-center">
                      <CheckCircle size={48} className="mb-2" />
                      Ce rendez-vous a déjà été réglé.
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between">
                  <button 
                    type="button" 
                    onClick={handleCancelAppointment}
                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Trash2 size={16} />
                    <span>Annuler le RDV</span>
                  </button>
                </div>
              </form>
            ) : (
              // VUE LECTURE SEULE (Thérapeute)
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                 <div className="bg-slate-100 p-3 rounded-full text-slate-400">
                    <Lock size={24} />
                 </div>
                 <p className="text-slate-500 text-sm max-w-xs">
                   Vous êtes en mode lecture seule. Veuillez contacter le secrétariat pour modifier ce rendez-vous ou encaisser un règlement.
                 </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};