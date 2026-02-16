import { Profile, Patient, Appointment, Transaction, UserRole } from '../types';

// Structure interne pour le mock avec mot de passe
interface DbUser extends Profile {
  password?: string;
}

// Initial Mock Data - Comptes par défaut
let users: DbUser[] = [
  { id: '1', full_name: 'Administrateur', username: 'admin', password: '123', role: 'admin' },
  { id: '2', full_name: 'Sophie Kiné', username: 'sophie', password: '123', role: 'therapeute' },
  { id: '3', full_name: 'Marc Ostéo', username: 'marc', password: '123', role: 'therapeute' },
  { id: '4', full_name: 'Julie Accueil', username: 'julie', password: '123', role: 'secretaire' },
];

let patients: Patient[] = [
  { 
    id: 'p1', 
    name: 'Jean Dupont', 
    age: 45, 
    address: '10 Rue de la Paix, Paris', 
    phone: '0601020304', 
    insurance: 'Alan', 
    pathology: 'Tendinite épaule',
    email: 'jean@gmail.com' 
  },
  { 
    id: 'p2', 
    name: 'Marie Curie', 
    age: 32, 
    address: '5 Avenue des Sciences, Lyon', 
    phone: '0699887766', 
    insurance: 'MGEN', 
    pathology: 'Lumbago',
    email: 'marie@science.com' 
  },
  { 
    id: 'p3', 
    name: 'Pierre Martin', 
    age: 58, 
    address: '12 Bd Victor Hugo, Nice', 
    phone: '0611223344', 
    insurance: 'Swiss Life', 
    pathology: 'Rééducation genou',
    email: 'pierre@test.com' 
  },
];

const today = new Date();
const setTime = (h: number, m: number) => {
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

let appointments: Appointment[] = [
  { 
    id: 'a1', 
    patientId: 'p1', patientName: 'Jean Dupont', 
    therapistId: '2', therapistName: 'Sophie Kiné', 
    start_time: setTime(9, 0), end_time: setTime(9, 30),
    type_soin: 'kinésithérapie classique', status: 'Confirmé', price: 35
  },
  { 
    id: 'a2', 
    patientId: 'p2', patientName: 'Marie Curie', 
    therapistId: '2', therapistName: 'Sophie Kiné', 
    start_time: setTime(10, 0), end_time: setTime(10, 45),
    type_soin: 'tecartherapie', status: 'Effectué', price: 50
  },
  { 
    id: 'a3', 
    patientId: 'p3', patientName: 'Pierre Martin', 
    therapistId: '3', therapistName: 'Marc Ostéo', 
    start_time: setTime(14, 0), end_time: setTime(15, 0),
    type_soin: 'ostéopathie', status: 'En attente', price: 60
  },
];

let transactions: Transaction[] = [
  { id: 't1', date: new Date(today.getTime() - 86400000).toISOString(), amount: 50.00, type: 'gain', category: 'Séance Tecar', method: 'TPE' },
  { id: 't2', date: new Date(today.getTime() - 86400000).toISOString(), amount: 1200.00, type: 'depense', category: 'Loyer', method: 'Chèque' },
  { id: 't3', date: new Date().toISOString(), amount: 60.00, type: 'gain', category: 'Séance Ostéo', method: 'Espèces' },
];

// Service Methods
export const mockDb = {
  // Auth & User Management
  login: async (username: string, password: string): Promise<Profile | null> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate latency
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      // Retourne le profil sans le mot de passe
      const { password, ...profile } = user;
      return profile;
    }
    return null;
  },

  getProfiles: async () => {
    // Retourne la liste sans les mots de passe
    return users.map(({ password, ...rest }) => rest);
  },

  createUser: async (userData: {username: string, password: string, full_name: string, role: UserRole}) => {
    const newUser: DbUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData
    };
    users.push(newUser);
    const { password, ...profile } = newUser;
    return profile;
  },

  updateProfileRole: async (id: string, role: UserRole) => {
    const p = users.find(p => p.id === id);
    if (p) p.role = role;
    const { password, ...profile } = p || {};
    return profile as Profile;
  },

  updateUserPassword: async (id: string, password: string) => {
    const u = users.find(u => u.id === id);
    if (u) u.password = password;
  },

  deleteUser: async (id: string) => {
    users = users.filter(u => u.id !== id);
  },

  // Patients
  getPatients: async () => [...patients],
  addPatient: async (p: Omit<Patient, 'id'>) => {
    const newP = { ...p, id: Math.random().toString(36).substr(2, 9) };
    patients.push(newP);
    return newP;
  },

  // Appointments
  getAppointments: async () => [...appointments],
  addAppointment: async (apt: Omit<Appointment, 'id'>) => {
    const newApt = { ...apt, id: Math.random().toString(36).substr(2, 9) };
    appointments.push(newApt);
    return newApt;
  },
  updateAppointmentStatus: async (id: string, status: Appointment['status']) => {
    const apt = appointments.find(a => a.id === id);
    if (apt) apt.status = status;
    return apt;
  },

  // Transactions
  getTransactions: async () => [...transactions],
  addTransaction: async (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: Math.random().toString(36).substr(2, 9) };
    transactions.push(newTx);
    return newTx;
  },
};