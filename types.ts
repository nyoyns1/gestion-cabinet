export type UserRole = 'admin' | 'therapeute' | 'secretaire';

export interface Profile {
  id: string;
  username: string; // Nouvel identifiant
  full_name: string;
  role: UserRole;
  // password n'est pas exposé dans le type Profile côté front pour sécurité
}

export type TreatmentType = 
  | 'tecartherapie' 
  | 'ondes de choc' 
  | 'ostéopathie' 
  | 'kinésithérapie classique' 
  | 'réathlétisation' 
  | 'renforcement' 
  | 'nutrition' 
  | 'consultation';

export type AppointmentStatus = 'Confirmé' | 'En attente' | 'Effectué' | 'Annulé';

export interface Patient {
  id: string;
  name: string;
  age: number;
  address: string;
  phone: string; // GSM
  insurance: string; // Mutuelle ou assurance
  pathology: string;
  email?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // Join helper
  therapistId: string;
  therapistName: string; // Join helper
  type_soin: TreatmentType;
  status: AppointmentStatus;
  start_time: string; // ISO String
  end_time: string; // ISO String
  price: number;
  notes?: string;
}

export type TransactionType = 'gain' | 'depense';
export type PaymentMethod = 'Espèces' | 'TPE' | 'Chèque';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  method: PaymentMethod;
  amount: number;
  date: string; // ISO String
}