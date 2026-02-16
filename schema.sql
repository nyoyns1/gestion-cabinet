-- Nouvelle table de gestion des accès (remplace profiles)
CREATE TABLE users_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Stocké en clair pour ce prototype (à hacher en prod)
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'therapeute', 'secretaire')) NOT NULL
);

CREATE TABLE patients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  address TEXT,
  phone TEXT, -- GSM
  insurance TEXT, -- Mutuelle
  pathology TEXT,
  email TEXT
);

CREATE TABLE appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES patients(id),
  therapist_id uuid REFERENCES users_access(id),
  type_soin TEXT CHECK (type_soin IN ('tecartherapie', 'ondes de choc', 'ostéopathie', 'kinésithérapie classique', 'réathlétisation', 'renforcement', 'nutrition', 'consultation')),
  status TEXT CHECK (status IN ('Confirmé', 'En attente', 'Effectué', 'Annulé')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  price DECIMAL DEFAULT 0,
  notes TEXT
);

CREATE TABLE transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('gain', 'depense')),
  category TEXT, -- loyer, matériel, etc.
  method TEXT CHECK (method IN ('Espèces', 'TPE', 'Chèque')),
  amount DECIMAL NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all users" ON users_access FOR ALL USING (
  EXISTS (SELECT 1 FROM users_access WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists see own, Admins/Secretaries see all" ON appointments FOR ALL USING (
  auth.uid() = therapist_id OR 
  EXISTS (SELECT 1 FROM users_access WHERE id = auth.uid() AND role IN ('admin', 'secretaire'))
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins only" ON transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM users_access WHERE id = auth.uid() AND role = 'admin')
);