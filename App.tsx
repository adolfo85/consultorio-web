
import React, { useState, useEffect } from 'react';
import { ViewState, Service, Appointment, WorkSchedule } from './types';
import { PatientBooking } from './components/PatientBooking';
import { AdminDashboard } from './components/AdminDashboard';
import { Calendar, Lock, AlertCircle, LogOut, Stethoscope, Loader2, WifiOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

// Initial Mock Data (Fallback & Restore Reference)
const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Consulta de Ortodoncia',
    durationMinutes: 30,
    price: 15000,
    description: 'Evaluación inicial para diagnóstico de ortodoncia y plan de tratamiento.',
    doctor: 'Dr. De Boeck'
  },
  {
    id: '2',
    name: 'Instalación de Brackets',
    durationMinutes: 90, // 1h 30m
    price: 120000,
    description: 'Colocación completa de aparatología fija superior e inferior.',
    doctor: 'Dr. De Boeck'
  },
  {
    id: '3',
    name: 'Ajuste Mensual',
    durationMinutes: 20,
    price: 25000,
    description: 'Control periódico y cambio de ligaduras/arcos.',
    doctor: 'Dr. De Boeck'
  },
  {
    id: '4',
    name: 'Escaneo 3D Invisalign',
    durationMinutes: 45,
    price: 45000,
    description: 'Escaneo digital para alineadores invisibles.',
    doctor: 'Dr. De Boeck'
  },
  {
    id: '5',
    name: 'Consulta de Odontología General',
    durationMinutes: 30,
    price: 15000,
    description: 'Revisión clínica general, diagnóstico de caries y salud bucal integral.',
    doctor: 'Dra. Rojas'
  }
];

const DEFAULT_SCHEDULE: WorkSchedule = {
  0: { enabled: false, start: "09:00", end: "13:00" }, // Sunday
  1: { enabled: true, start: "09:00", end: "18:00" },  // Monday
  2: { enabled: true, start: "09:00", end: "18:00" },  // Tuesday
  3: { enabled: true, start: "09:00", end: "18:00" },  // Wednesday
  4: { enabled: true, start: "09:00", end: "18:00" },  // Thursday
  5: { enabled: true, start: "09:00", end: "17:00" },  // Friday
  6: { enabled: false, start: "09:00", end: "13:00" }, // Saturday
};

// Default RD Logo
const DEFAULT_LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%230f766e' stroke-width='5' /%3E%3Ctext x='50' y='65' font-family='Arial, sans-serif' font-size='50' font-weight='bold' text-anchor='middle' fill='%23334155' letter-spacing='-2'%3Erd%3C/text%3E%3C/svg%3E`;

// Helper to calculate end time string
const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(DEFAULT_SCHEDULE);
  const [logo, setLogo] = useState<string>(DEFAULT_LOGO);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<'admin' | 'rojas'>('admin');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // FETCH DATA FROM SUPABASE
  const fetchData = async () => {
    setConnectionError(null);
    if (!isSupabaseConfigured()) {
      // Local storage fallback
      const storedApps = localStorage.getItem('rojas_deboeck_appointments');
      if (storedApps) setAppointments(JSON.parse(storedApps));
      const storedSchedule = localStorage.getItem('rojas_deboeck_schedule');
      if (storedSchedule) setWorkSchedule(JSON.parse(storedSchedule));
      const storedServices = localStorage.getItem('rojas_deboeck_services');
      if (storedServices) setServices(JSON.parse(storedServices));
      const storedLogo = localStorage.getItem('rojas_deboeck_logo');
      if (storedLogo) setLogo(storedLogo);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch Services - Leemos la base de datos real
      const { data: dbServices, error: servicesError } = await supabase
        .from('services')
        .select('*');
      
      if (!servicesError && dbServices && dbServices.length > 0) {
        const mappedServices: Service[] = dbServices.map((s: any) => ({
            id: s.id,
            name: s.name,
            durationMinutes: Number(s.duration_minutes),
            price: Number(s.price),
            description: s.description,
            doctor: s.doctor || 'Dr. De Boeck' // Leemos la columna doctor
        }));
        
        // Ordenamos por ID (numérico) para mantener consistencia visual
        mappedServices.sort((a, b) => Number(a.id) - Number(b.id));
        
        setServices(mappedServices);
      } else {
        // Fallback si la tabla está vacía
        setServices(INITIAL_SERVICES);
      }

      // 2. Fetch Config (Schedule & Logo)
      const { data: dbConfig } = await supabase.from('config').select('*').eq('id', 'global_config').single();
      if (dbConfig) {
        if (dbConfig.schedule) setWorkSchedule(dbConfig.schedule);
        if (dbConfig.logo) setLogo(dbConfig.logo);
      }

      // 3. Fetch Appointments
      const { data: dbApps } = await supabase.from('appointments').select('*');
      if (dbApps) {
        const mappedApps = dbApps.map((a: any) => ({
          id: a.id,
          serviceId: a.service_id,
          patientName: a.patient_name,
          patientEmail: a.patient_email,
          patientPhone: a.patient_phone,
          date: a.date,
          time: a.time,
          endTime: a.end_time,
          status: a.status,
          notes: a.notes
        }));
        setAppointments(mappedApps);
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      setConnectionError(error.message || "Error desconocido de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookAppointment = async (data: Omit<Appointment, 'id' | 'status' | 'endTime'>) => {
    const service = services.find(s => s.id === data.serviceId);
    const duration = service ? service.durationMinutes : 30;
    const endTime = addMinutesToTime(data.time, duration);

    const newApp = {
        service_id: data.serviceId,
        patient_name: data.patientName,
        patient_email: data.patientEmail,
        patient_phone: data.patientPhone,
        date: data.date,
        time: data.time,
        end_time: endTime,
        status: 'confirmed',
        notes: data.notes
    };

    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('appointments').insert(newApp);
        if (!error) {
            fetchData(); 
            setView(ViewState.LANDING);
            setShowSuccessModal(true);
        } else {
            alert("Error al guardar turno. Intente nuevamente.");
        }
    } else {
        const localApp = { ...data, id: crypto.randomUUID(), status: 'confirmed' as const, endTime };
        const updated = [...appointments, localApp];
        setAppointments(updated);
        localStorage.setItem('rojas_deboeck_appointments', JSON.stringify(updated));
        setView(ViewState.LANDING);
        setShowSuccessModal(true);
    }
  };

  const handleStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    if (isSupabaseConfigured()) {
        await supabase.from('appointments').update({ status }).eq('id', id);
        fetchData();
    } else {
        const updated = appointments.map(app => app.id === id ? { ...app, status } : app);
        setAppointments(updated);
        localStorage.setItem('rojas_deboeck_appointments', JSON.stringify(updated));
    }
  };

  const handleUpdateSchedule = async (newSchedule: WorkSchedule) => {
    setWorkSchedule(newSchedule);
    if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ id: 'global_config', schedule: newSchedule });
    } else {
        localStorage.setItem('rojas_deboeck_schedule', JSON.stringify(newSchedule));
    }
  };

  const handleUpdateLogo = async (newLogo: string) => {
    setLogo(newLogo);
    if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ id: 'global_config', logo: newLogo });
    } else {
        localStorage.setItem('rojas_deboeck_logo', newLogo);
    }
  };

  // GUARDADO OPTIMIZADO (Bulk Upsert)
  const handleUpdateServices = async (newServices: Service[]) => {
    setServices(newServices);
    if (isSupabaseConfigured()) {
        // Mapeamos al formato SQL y enviamos todo junto
        const servicesPayload = newServices.map(s => ({
             id: s.id,
             name: s.name,
             duration_minutes: s.durationMinutes,
             price: s.price,
             description: s.description,
             doctor: s.doctor
        }));

        const { error } = await supabase.from('services').upsert(servicesPayload);
        
        if (error) {
            console.error("Error guardando servicios:", error);
            alert("Hubo un error guardando los cambios en la base de datos.");
        }
    } else {
        localStorage.setItem('rojas_deboeck_services', JSON.stringify(newServices));
    }
  };

  const handleRestoreServices = async () => {
      setServices(INITIAL_SERVICES);
      if (isSupabaseConfigured()) {
          // 1. Limpiamos la tabla
          await supabase.from('services').delete().neq('id', '0'); 
          
          // 2. Insertamos los iniciales
          const servicesPayload = INITIAL_SERVICES.map(s => ({
             id: s.id,
             name: s.name,
             duration_minutes: s.durationMinutes,
             price: s.price,
             description: s.description,
             doctor: s.doctor 
          }));
          
          await supabase.from('services').upsert(servicesPayload);
      }
      alert("Servicios restaurados correctamente.");
  };

  const handleDeleteServiceDB = async (serviceId: string) => {
      if (isSupabaseConfigured()) {
          const { error } = await supabase.from('services').delete().eq('id', serviceId);
          if (error) {
              alert("Error al eliminar servicio.");
              return false;
          }
          return true;
      }
      return true;
  }

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setView(ViewState.ADMIN);
    } else {
      setShowLoginModal(true);
      setAuthError(false);
      setPasswordInput('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '31842796') {
      setIsAuthenticated(true);
      setCurrentUser('admin');
      setShowLoginModal(false);
      setView(ViewState.ADMIN);
    } else if (passwordInput === '1287') {
      setIsAuthenticated(true);
      setCurrentUser('rojas');
      setShowLoginModal(false);
      setView(ViewState.ADMIN);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView(ViewState.LANDING);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-teal-600" />
              <p>Conectando con el consultorio...</p>
          </div>
      )
  }

  if (connectionError) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <WifiOff className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Conexión</h2>
              <p className="text-slate-600 mb-4 max-w-md">
                  No se pudo conectar a la base de datos. Verifica tu configuración.
              </p>
              <div className="bg-slate-900 text-white p-4 rounded-lg text-xs font-mono text-left w-full max-w-md overflow-auto">
                  {connectionError}
              </div>
              <button onClick={fetchData} className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700">
                  Reintentar
              </button>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center cursor-pointer gap-3 group"
              onClick={() => setView(ViewState.LANDING)}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                 <img 
                   src={logo} 
                   alt="Logo" 
                   className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                 />
              </div>
              <div className="flex flex-col leading-none justify-center h-full">
                <span className="text-xl font-bold text-slate-800 tracking-tight">Rojas-De Boeck</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {view === ViewState.ADMIN ? (
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-500 uppercase">
                        {currentUser === 'rojas' ? 'Dra. Rojas' : 'Admin'}
                    </span>
                    <button 
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Cerrar Sesión"
                    >
                    <LogOut className="w-5 h-5" />
                    </button>
                </div>
              ) : (
                <button 
                  onClick={handleAdminClick}
                  className="text-slate-300 hover:text-slate-500 transition-colors p-2"
                  title="Acceso Administrativo"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
              
              {view === ViewState.LANDING && (
                <button 
                  onClick={() => setView(ViewState.BOOKING)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-teal-200/50 hover:bg-teal-500 transition-all transform hover:-translate-y-0.5"
                >
                  Agendar cita
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mt-6">
        {view === ViewState.LANDING && (
          <div className="max-w-6xl mx-auto px-4 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden mb-16 bg-slate-900 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=2000" 
                alt="Dental Clinic" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/20"></div>
              <div className="relative z-10 py-20 sm:py-32 px-8 sm:px-16 max-w-3xl">
                <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                  Tu sonrisa en <br/>
                  <span className="text-teal-400">Manos Expertas</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-200 mb-10 font-light">
                  Tecnología de vanguardia y atención personalizada. Especialistas en ortodoncia y estética dental.
                </p>
                <button 
                  onClick={() => setView(ViewState.BOOKING)}
                  className="bg-teal-500 hover:bg-teal-400 text-white text-lg px-8 py-4 rounded-full font-bold shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2 group"
                >
                  Agendar cita
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {services.map(s => (
                <div key={s.id} className="bg-sky-50 rounded-xl shadow-sm border border-sky-100 hover:shadow-lg hover:border-teal-200 transition-all group overflow-hidden cursor-pointer p-6 flex flex-col h-full justify-between" onClick={() => setView(ViewState.BOOKING)}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-3 inline-block ${s.doctor === 'Dra. Rojas' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                        {s.doctor || 'Dr. De Boeck'}
                    </span>
                    <h3 className="text-lg font-bold mb-2 text-slate-800 group-hover:text-teal-700 transition-colors">{s.name}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">{s.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-200/50">
                    <span className="text-xs bg-white text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 font-medium border border-slate-100">
                        <Stethoscope className="w-3 h-3" /> {s.durationMinutes} min
                    </span>
                    <span className="text-teal-700 font-bold">
                      ${s.price.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === ViewState.BOOKING && (
          <div className="px-4">
             <PatientBooking 
              services={services}
              existingAppointments={appointments}
              workSchedule={workSchedule}
              onBook={handleBookAppointment}
            />
          </div>
        )}

        {view === ViewState.ADMIN && (
          <div className="px-4 animate-fade-in">
            <AdminDashboard 
              appointments={appointments}
              services={services}
              workSchedule={workSchedule}
              currentLogo={logo}
              onUpdateSchedule={handleUpdateSchedule}
              onStatusChange={handleStatusChange}
              onUpdateServices={handleUpdateServices}
              onDeleteServiceDB={handleDeleteServiceDB}
              onUpdateLogo={handleUpdateLogo}
              onRestoreDefaults={handleRestoreServices}
            />
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Acceso Profesional</h3>
            <p className="text-slate-500 text-center text-sm mb-6">Ingrese su clave.</p>
            
            <form onSubmit={handleLoginSubmit}>
              <input 
                type="password" 
                autoFocus
                placeholder="••••••••"
                className={`w-full border rounded-lg px-4 py-3 outline-none transition-all mb-4 text-center font-bold tracking-widest text-lg bg-white text-slate-900 ${authError ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400' : 'border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {authError && (
                <p className="text-red-500 text-xs text-center mb-4 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Contraseña incorrecta
                </p>
              )}
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                Ingresar
              </button>
              <button 
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full mt-4 text-slate-400 text-sm hover:text-slate-800 transition-colors"
              >
                Volver al sitio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up border-t-4 border-teal-500">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Calendar className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Turno Confirmado!</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Tu cita en <strong>Consultorio Rojas-De Boeck</strong> ha sido registrada exitosamente.
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center">
           <div className="flex items-center gap-2 mb-4">
               <div className="w-6 h-6">
                 <img src={logo} alt="Logo Footer" className="w-full h-full object-contain opacity-50 grayscale" />
               </div>
              <span className="font-bold tracking-tight text-slate-400">Rojas-De Boeck</span>
           </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Consultorio Odontológico Rojas-De Boeck.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
