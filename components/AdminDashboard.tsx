
import React, { useState, useEffect } from 'react';
import { Appointment, Service, WorkSchedule, FAQ } from '../types';
import { analyzeSchedule } from '../services/geminiService';
import { Calendar as CalendarIcon, User, Clock, CheckCircle, XCircle, Sparkles, RefreshCw, Settings, Save, Briefcase, Edit2, DollarSign, Share2, Upload, Image as ImageIcon, MessageCircle, Bell, Trash2, PlusCircle, RefreshCcw, CalendarOff, ShieldCheck, HelpCircle } from 'lucide-react';

interface AdminDashboardProps {
  appointments: Appointment[];
  services: Service[];
  faqs: FAQ[];
  workSchedule: WorkSchedule;
  currentLogo?: string;
  blockedDates: string[];
  currentUserRole: 'admin' | 'rojas'; 
  onUpdateSchedule: (schedule: WorkSchedule, doctorKey: string) => void;
  onStatusChange: (id: string, status: 'confirmed' | 'cancelled') => void;
  onUpdateServices: (services: Service[]) => void;
  onDeleteServiceDB?: (id: string) => Promise<boolean>;
  onUpdateLogo?: (logo: string) => void;
  onRestoreDefaults?: () => Promise<void>;
  onUpdateBlockedDates: (dates: string[], doctorKey: string) => void;
  onSaveFAQ: (faq: FAQ) => void;
  onDeleteFAQ: (id: string) => void;
}

const DAYS_OF_WEEK = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  appointments, 
  services, 
  faqs,
  workSchedule, 
  currentLogo,
  blockedDates = [],
  currentUserRole,
  onUpdateSchedule, 
  onStatusChange,
  onUpdateServices,
  onDeleteServiceDB,
  onUpdateLogo,
  onRestoreDefaults,
  onUpdateBlockedDates,
  onSaveFAQ,
  onDeleteFAQ
}) => {
  const [tab, setTab] = useState<'agenda' | 'settings' | 'services' | 'faqs'>('agenda');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const [filterDate, setFilterDate] = useState<string>(todayStr);
  const [blockDateInput, setBlockDateInput] = useState('');

  const [tempSchedule, setTempSchedule] = useState<WorkSchedule>(workSchedule);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  const doctorName = currentUserRole === 'admin' ? 'Dr. De Boeck' : 'Dra. Rojas';
  const doctorKey = currentUserRole === 'admin' ? 'dr_deboeck' : 'dra_rojas';

  useEffect(() => {
      setTempSchedule(workSchedule);
  }, [workSchedule]);

  const myAppointments = appointments.filter(app => {
      const service = services.find(s => s.id === app.serviceId);
      const appDoctor = service?.doctor || 'Dr. De Boeck';
      return appDoctor === doctorName;
  });

  const filteredAppointments = myAppointments
    .filter(app => app.date === filterDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const todaysAppointments = myAppointments
    .filter(app => app.date === todayStr && app.status === 'confirmed')
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSchedule(myAppointments, services, filterDate);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSaveSettings = () => {
    onUpdateSchedule(tempSchedule, doctorKey);
    alert(`¡Guardado! La agenda de ${doctorName} ha sido actualizada.`);
  };

  const handleScheduleChange = (dayIndex: number, field: 'enabled' | 'start' | 'end', value: any) => {
    setTempSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value
      }
    }));
  };

  const handleAddBlockedDate = () => {
      if (!blockDateInput) return;
      if (!blockedDates.includes(blockDateInput)) {
          const newDates = [...blockedDates, blockDateInput].sort();
          onUpdateBlockedDates(newDates, doctorKey);
      }
      setBlockDateInput('');
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
      const newDates = blockedDates.filter(d => d !== dateToRemove);
      onUpdateBlockedDates(newDates, doctorKey);
  };

  const handleAddService = () => {
      setEditingService({
          id: crypto.randomUUID(), 
          name: '',
          durationMinutes: 30,
          price: 0,
          description: '',
          doctor: doctorName
      });
  };

  const handleDeleteService = async (id: string) => {
      if (confirm("¿Estás seguro de eliminar este servicio?")) {
          const success = await onDeleteServiceDB?.(id);
          if (success) {
              const updatedServices = services.filter(s => s.id !== id);
              onUpdateServices(updatedServices);
          }
      }
  };

  const handleRestore = async () => {
      if (confirm("¿Restaurar servicios por defecto?")) {
          await onRestoreDefaults?.();
      }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    const exists = services.some(s => s.id === editingService.id);
    
    if (exists) {
        const updatedServices = services.map(s => s.id === editingService.id ? editingService : s);
        onUpdateServices(updatedServices);
    } else {
        const newService = { ...editingService };
        onUpdateServices([...services, newService]);
    }
    setEditingService(null);
  };

  const handleAddFAQ = () => {
      setEditingFAQ({ id: '', question: '', answer: '' });
  };

  const handleSubmitFAQ = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingFAQ) {
          onSaveFAQ(editingFAQ);
          setEditingFAQ(null);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { 
          alert("Imagen muy grande (max 2MB).");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.origin;
    navigator.clipboard.writeText(link).then(() => {
        alert("¡Link copiado!\n\n" + link);
    });
  };

  const sendWhatsAppReminder = (app: Appointment, isToday: boolean) => {
    const service = services.find(s => s.id === app.serviceId);
    const cleanPhone = app.patientPhone.replace(/\D/g, '');
    
    let message = '';
    if (isToday) {
        message = `Hola ${app.patientName}, te escribo del Consultorio Rojas-De Boeck para recordarte que HOY tienes turno a las ${app.time} hs para ${service?.name} con ${doctorName}. Te esperamos!`;
    } else {
        const [y, m, d] = app.date.split('-');
        const readableDate = `${d}/${m}`;
        message = `Hola ${app.patientName}, te confirmamos tu turno en Consultorio Rojas-De Boeck para el día ${readableDate} a las ${app.time} hs. Tratamiento: ${service?.name} con ${doctorName}. Por favor confirmar. Gracias.`;
    }
    
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getServiceDetails = (serviceId: string) => services.find(s => s.id === serviceId);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Administración</h2>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-md border border-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="text-teal-800 font-bold text-sm">{doctorName}</span>
            </div>
            <span className="text-slate-300">|</span>
            <button onClick={handleCopyLink} className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1 transition-colors">
                <Share2 className="w-3 h-3" /> Link Pacientes
            </button>
          </div>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          <button onClick={() => setTab('agenda')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'agenda' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}><CalendarIcon className="w-4 h-4" /> Agenda</button>
          <button onClick={() => setTab('services')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'services' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}><Briefcase className="w-4 h-4" /> Servicios</button>
          <button onClick={() => setTab('faqs')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'faqs' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}><HelpCircle className="w-4 h-4" /> FAQs</button>
          <button onClick={() => setTab('settings')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'settings' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}><Settings className="w-4 h-4" /> Configuración</button>
        </div>
      </header>

      {tab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {todaysAppointments.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-white rounded-xl p-4 border border-teal-200 shadow-sm">
                    <h3 className="text-teal-800 font-bold flex items-center gap-2 mb-3"><Bell className="w-5 h-5" /> Recordatorios de Hoy ({todayStr})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {todaysAppointments.map(app => (
                            <div key={`reminder-${app.id}`} className="bg-white p-3 rounded-lg border border-teal-100 flex items-center justify-between shadow-sm">
                                <div><p className="font-bold text-slate-800 text-sm">{app.patientName}</p><p className="text-xs text-slate-500">{app.time} hs - {getServiceDetails(app.serviceId)?.name}</p></div>
                                <button onClick={() => sendWhatsAppReminder(app, true)} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md transition-all"><MessageCircle className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-teal-600" /> Turnos Agendados</h3>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-800" />
              </div>
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">No hay turnos para {doctorName} en esta fecha.</div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map(app => {
                    const service = getServiceDetails(app.serviceId);
                    const isToday = app.date === todayStr;
                    return (
                      <div key={app.id} className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border transition-all ${app.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-md'}`}>
                        <div className="flex items-center sm:flex-col sm:justify-center sm:min-w-[100px] text-slate-700 bg-slate-50 rounded-md p-2"><span className="text-lg font-bold">{app.time}</span></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div><h4 className="font-bold text-slate-800 text-lg">{app.patientName}</h4><p className="text-sm text-teal-700 font-medium">{service?.name}</p></div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{app.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}</span>
                          </div>
                          <div className="mt-2 text-sm text-slate-500 flex flex-col gap-1"><span className="flex items-center gap-2"><User className="w-3 h-3" /> {app.patientPhone}</span></div>
                        </div>
                        <div className="flex sm:flex-col justify-end gap-2 border-l border-slate-100 pl-4">
                          {app.status === 'confirmed' && <button onClick={() => sendWhatsAppReminder(app, isToday)} className="text-green-600 hover:bg-green-50 p-2 rounded"><MessageCircle className="w-5 h-5" /></button>}
                          {app.status !== 'cancelled' ? <button onClick={() => onStatusChange(app.id, 'cancelled')} className="text-red-500 hover:bg-red-50 p-2 rounded"><XCircle className="w-5 h-5" /></button> : <button onClick={() => onStatusChange(app.id, 'confirmed')} className="text-green-500 hover:bg-green-50 p-2 rounded"><CheckCircle className="w-5 h-5" /></button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10"><h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> Asistente IA</h3><button onClick={handleAnalyze} disabled={isAnalyzing} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all flex items-center gap-1">{isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Analizar'}</button></div>
              <div className="min-h-[150px] text-sm leading-relaxed text-slate-300 relative z-10">{aiAnalysis ? <p className="whitespace-pre-line">{aiAnalysis}</p> : <p className="italic opacity-60">Analiza la carga de trabajo.</p>}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">Servicios</h3><div className="flex gap-2"><button onClick={handleRestore} className="border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"><RefreshCcw className="w-4 h-4" /></button><button onClick={handleAddService} className="bg-teal-600 text-white px-4 py-2 rounded-lg shadow-md font-bold text-sm flex items-center gap-2 hover:bg-teal-700"><PlusCircle className="w-4 h-4" /> Nuevo</button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {services.map(service => (
               <div key={service.id} className="border border-slate-200 rounded-xl p-4 hover:border-teal-300 bg-slate-50 relative">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-slate-100 mb-1 inline-block ${service.doctor === 'Dra. Rojas' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>{service.doctor || 'Dr. De Boeck'}</span>
                  <h4 className="font-bold text-slate-800 pr-12">{service.name}</h4>
                  <div className="flex items-center gap-3 mt-2 text-sm"><span className="text-slate-600 bg-white px-2 py-1 rounded border border-slate-100"><Clock className="w-3 h-3 mr-1 inline" /> {service.durationMinutes} min</span><span className="text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100 font-bold"><DollarSign className="w-3 h-3 mr-1 inline" /> {service.price.toLocaleString('es-AR')}</span></div>
                  <div className="absolute top-4 right-4 flex gap-2"><button onClick={() => setEditingService(service)} className="p-2 bg-white border border-slate-200 rounded hover:text-teal-700"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteService(service.id)} className="p-2 bg-white border border-slate-200 rounded hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
               </div>
             ))}
          </div>
          {editingService && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">{services.some(s => s.id === editingService.id) ? 'Editar' : 'Nuevo'} Servicio</h3><button onClick={() => setEditingService(null)}><XCircle className="w-6 h-6 text-slate-400" /></button></div>
                <form onSubmit={handleSaveService} className="space-y-4">
                  <input type="text" required value={editingService.name} onChange={(e) => setEditingService({...editingService, name: e.target.value})} className="w-full border p-2 rounded" placeholder="Nombre" />
                  <select value={editingService.doctor || doctorName} onChange={(e) => setEditingService({...editingService, doctor: e.target.value})} className="w-full border p-2 rounded"><option value="Dr. De Boeck">Dr. De Boeck</option><option value="Dra. Rojas">Dra. Rojas</option></select>
                  <div className="grid grid-cols-2 gap-4"><input type="number" required value={editingService.price} onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})} className="w-full border p-2 rounded" placeholder="Precio" /><input type="number" required step="5" value={editingService.durationMinutes} onChange={(e) => setEditingService({...editingService, durationMinutes: Number(e.target.value)})} className="w-full border p-2 rounded" placeholder="Minutos" /></div>
                  <textarea required value={editingService.description} onChange={(e) => setEditingService({...editingService, description: e.target.value})} className="w-full border p-2 rounded h-24" placeholder="Descripción" />
                  <button type="submit" className="w-full bg-teal-600 text-white p-2 rounded font-bold">Guardar</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQs Management Tab */}
      {tab === 'faqs' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Gestión de Preguntas Frecuentes</h3>
                  <button onClick={handleAddFAQ} className="bg-teal-600 text-white px-4 py-2 rounded-lg shadow-md font-bold text-sm flex items-center gap-2 hover:bg-teal-700">
                      <PlusCircle className="w-4 h-4" /> Nueva Pregunta
                  </button>
              </div>
              <div className="space-y-4">
                  {faqs.map(faq => (
                      <div key={faq.id} className="border border-slate-200 rounded-xl p-4 hover:border-teal-300 bg-slate-50 flex justify-between items-start gap-4">
                          <div>
                              <h4 className="font-bold text-slate-800 mb-1">{faq.question}</h4>
                              <p className="text-sm text-slate-600 line-clamp-2">{faq.answer}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                              <button onClick={() => setEditingFAQ(faq)} className="p-2 bg-white border border-slate-200 rounded hover:text-teal-700"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => onDeleteFAQ(faq.id)} className="p-2 bg-white border border-slate-200 rounded hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </div>
                  ))}
                  {faqs.length === 0 && <p className="text-center text-slate-400 py-8 italic">No hay preguntas frecuentes registradas.</p>}
              </div>
              {editingFAQ && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in-up">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-slate-800">{editingFAQ.id ? 'Editar' : 'Nueva'} Pregunta</h3>
                              <button onClick={() => setEditingFAQ(null)}><XCircle className="w-6 h-6 text-slate-400" /></button>
                          </div>
                          <form onSubmit={handleSubmitFAQ} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Pregunta</label>
                                  <input type="text" required className="w-full border p-2 rounded bg-white text-slate-900" value={editingFAQ.question} onChange={(e) => setEditingFAQ({...editingFAQ, question: e.target.value})} placeholder="Ej: ¿Aceptan tarjeta?" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Respuesta</label>
                                  <textarea required className="w-full border p-2 rounded bg-white text-slate-900 h-32 resize-none" value={editingFAQ.answer} onChange={(e) => setEditingFAQ({...editingFAQ, answer: e.target.value})} placeholder="Respuesta clara." />
                              </div>
                              <button type="submit" className="w-full bg-teal-600 text-white p-2 rounded font-bold hover:bg-teal-700">Guardar</button>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      )}

      {tab === 'settings' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-8">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                   <div className="mb-6 border-b border-slate-100 pb-4"><h3 className="text-xl font-bold text-slate-800">Identidad</h3><p className="text-sm text-slate-500">Personaliza el logo (Global).</p></div>
                   <div className="flex items-center gap-4"><div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-2"><img src={currentLogo} alt="Current Logo" className="w-full h-full object-contain" /></div><label className="inline-flex items-center cursor-pointer"><div className="flex items-center justify-center py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-md"><Upload className="w-4 h-4 mr-2" /> Subir</div><input type="file" accept="image/*" className="hidden" onChange={(e) => onUpdateLogo && handleImageUpload(e, onUpdateLogo)} /></label></div>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 border-l-4 border-l-red-500">
                   <div className="mb-6 border-b border-slate-100 pb-4"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CalendarOff className="w-5 h-5 text-red-500" /> Días Bloqueados</h3><p className="text-sm text-slate-600">Agenda de: <strong className="text-slate-900 bg-slate-100 px-1 rounded">{doctorName}</strong></p></div>
                   <div className="flex gap-2 mb-4"><input type="date" className="border border-slate-300 rounded px-3 py-2 text-sm flex-1" value={blockDateInput} onChange={(e) => setBlockDateInput(e.target.value)} /><button onClick={handleAddBlockedDate} disabled={!blockDateInput} className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50">Bloquear</button></div>
                   <div className="flex flex-wrap gap-2">{blockedDates.length === 0 && <span className="text-slate-400 italic text-sm">No hay bloqueos.</span>}{blockedDates.map(date => (<div key={date} className="bg-red-50 border border-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-2">{new Date(date).toLocaleDateString('es-ES', {day: 'numeric', month: 'numeric'})}<button onClick={() => handleRemoveBlockedDate(date)}><XCircle className="w-3 h-3 hover:text-red-900" /></button></div>))}</div>
               </div>
           </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 border-l-4 border-l-teal-500">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4"><div><h3 className="text-xl font-bold text-slate-800">Horarios Semanales</h3><p className="text-sm text-slate-600">Configurando: <strong className="text-slate-900 bg-slate-100 px-1 rounded">{doctorName}</strong></p></div><button onClick={handleSaveSettings} className="bg-teal-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-teal-700 shadow-sm text-sm font-bold"><Save className="w-4 h-4" /> Guardar</button></div>
            <div className="space-y-3">{DAYS_OF_WEEK.map((dayName, index) => { const config = tempSchedule[index] || { enabled: false, start: "09:00", end: "18:00" }; return (<div key={index} className={`flex items-center gap-2 p-3 rounded-lg border ${config.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-60'}`}><div className="w-28"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={config.enabled} onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)} className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300" /><span className={`text-sm font-medium ${config.enabled ? 'text-slate-800' : 'text-slate-500'}`}>{dayName}</span></label></div><div className="flex items-center gap-2 flex-1"><input type="time" disabled={!config.enabled} value={config.start} onChange={(e) => handleScheduleChange(index, 'start', e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs w-20" /><span className="text-slate-300">-</span><input type="time" disabled={!config.enabled} value={config.end} onChange={(e) => handleScheduleChange(index, 'end', e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs w-20" /></div></div>);})}</div>
          </div>
        </div>
      )}
    </div>
  );
};