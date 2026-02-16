import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { Patient } from '../types';
import { Search, Plus, User as UserIcon, Save, MapPin, Phone, ShieldCheck, Activity } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Patients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    insurance: '',
    pathology: '',
    email: ''
  });

  useEffect(() => {
    loadPatients();
  }, [user]);

  const loadPatients = async () => {
    let data = await mockDb.getPatients();

    // Si c'est un thérapeute, on filtre pour ne montrer que ses patients
    // (Ceux avec qui il a au moins un rendez-vous dans l'historique ou le futur)
    if (user?.role === 'therapeute') {
      const appointments = await mockDb.getAppointments();
      const myPatientIds = new Set(
        appointments
          .filter(apt => apt.therapistId === user.id)
          .map(apt => apt.patientId)
      );
      
      data = data.filter(p => myPatientIds.has(p.id));
    }

    setPatients(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    await mockDb.addPatient({
      name: formData.name,
      age: parseInt(formData.age) || 0,
      address: formData.address,
      phone: formData.phone,
      insurance: formData.insurance,
      pathology: formData.pathology,
      email: formData.email
    });
    
    // Reset and reload
    setFormData({ name: '', age: '', address: '', phone: '', insurance: '', pathology: '', email: '' });
    setIsModalOpen(false);
    await loadPatients();
  };

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500">
            {user?.role === 'therapeute' 
              ? 'Vos dossiers patients.' 
              : 'Gérez les dossiers patients complets.'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-sm transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Ajouter Patient</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un patient..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map(patient => (
            <div key={patient.id} className="p-4 hover:bg-slate-50 transition-colors group">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{patient.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <Activity size={14} /> <span>{patient.age} ans</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Phone size={14} /> <span>{patient.phone}</span>
                      </span>
                      {patient.address && (
                        <span className="flex items-center space-x-1">
                          <MapPin size={14} /> <span className="truncate max-w-[150px]">{patient.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                   {patient.insurance && (
                     <div className="flex items-center space-x-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                       <ShieldCheck size={12} />
                       <span>{patient.insurance}</span>
                     </div>
                   )}
                   {patient.pathology && (
                     <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                       {patient.pathology}
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              {user?.role === 'therapeute' 
                ? "Aucun patient trouvé. Vous ne voyez que les patients avec qui vous avez des rendez-vous." 
                : "Aucun patient trouvé."}
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nouveau Dossier Patient"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Âge</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                placeholder="Ans"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GSM <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="06..."
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="@"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Adresse complète"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mutuelle / Assurance</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.insurance}
                onChange={e => setFormData({...formData, insurance: e.target.value})}
                placeholder="Ex: Alan, MGEN..."
              />
            </div>
            <div>
               {/* Spacer or additional field if needed later */}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pathologie</label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              value={formData.pathology}
              onChange={e => setFormData({...formData, pathology: e.target.value})}
              placeholder="Description de la pathologie..."
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors mt-6"
          >
            <Save size={18} />
            <span>Enregistrer le dossier</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};