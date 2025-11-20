
import React, { useState } from 'react';
import { Appointment, Service, WorkSchedule } from '../types';
import { analyzeSchedule } from '../services/geminiService';
import { Calendar as CalendarIcon, User, Clock, CheckCircle, XCircle, Sparkles, RefreshCw, Settings, Save, Briefcase, Edit2, DollarSign, Share2, Upload, Image as ImageIcon, MessageCircle, Bell, Trash2, PlusCircle, RefreshCcw } from 'lucide-react';

interface AdminDashboardProps {
  appointments: Appointment[];
  services: Service[];
  workSchedule: WorkSchedule;
  currentLogo?: string;
  onUpdateSchedule: (schedule: WorkSchedule) => void;
  onStatusChange: (id: string, status: 'confirmed' | 'cancelled') => void;
  onUpdateServices: (services: Service[]) => void;
  onDeleteServiceDB?: (id: string) => Promise<boolean>;
  onUpdateLogo?: (logo: string) => void;
  onRestoreDefaults?: () => Promise<void>;
}

const DAYS_OF_WEEK = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  appointments, 
  services, 
  workSchedule, 
  currentLogo,
  onUpdateSchedule, 
  onStatusChange,
  onUpdateServices,
  onDeleteServiceDB,
  onUpdateLogo,
  onRestoreDefaults
}) => {
  const [tab, setTab] = useState<'agenda' | 'settings' | 'services'>('agenda');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Default to today's date in local time
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const [filterDate, setFilterDate] = useState<string>(todayStr);

  const [tempSchedule, setTempSchedule] = useState<WorkSchedule>(workSchedule);
  
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredAppointments = appointments
    .filter(app => app.date === filterDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const todaysAppointments = appointments
    .filter(app => app.date === todayStr && app.status === 'confirmed')
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSchedule(appointments, services, filterDate);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSaveSettings = () => {
    onUpdateSchedule(tempSchedule);
    alert("Configuración guardada correctamente.");
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

  const handleAddService = () => {
      setEditingService({
          id: crypto.randomUUID(), 
          name: '',
          durationMinutes: 30,
          price: 0,
          description: '',
          doctor: 'Dr. De Boeck'
      });
  };

  const handleDeleteService = async (id: string) => {
      if (confirm("¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer.")) {
          const success = await onDeleteServiceDB?.(id);
          if (success) {
              const updatedServices = services.filter(s => s.id !== id);
              onUpdateServices(updatedServices);
          }
      }
  };

  const handleRestore = async () => {
      if (confirm("¿Estás seguro? Esto restaurará los servicios por defecto de ambos doctores.")) {
          await onRestoreDefaults?.();
      }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    // Check if it is a new service (id not in current list) or update
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

  // Helper to handle file upload and convert to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { 
          alert("El archivo es muy grande. Se recomienda usar imágenes de menos de 2MB.");
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
        alert("¡Link copiado!\n\n" + link + "\n\nComparte este link con tus pacientes para que reserven su turno.");
    });
  };

  const sendWhatsAppReminder = (app: Appointment, isToday: boolean) => {
    const service = services.find(s => s.id === app.serviceId);
    const cleanPhone = app.patientPhone.replace(/\D/g, '');
    
    let message = '';
    if (isToday) {
        message = `Hola ${app.patientName}, te escribo del Consultorio Rojas-De Boeck para recordarte que HOY tienes turno a las ${app.time} hs para ${service?.name}. Te esperamos!`;
    } else {
        const [y, m, d] = app.date.split('-');
        const readableDate = `${d}/${m}`;
        message = `Hola ${app.patientName}, te confirmamos tu turno en Consultorio Rojas-De Boeck para el día ${readableDate} a las ${app.time} hs. Tratamiento: ${service?.name}. Por favor confirmar. Gracias.`;
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
            <p className="text-slate-500">Consultorio Rojas-De Boeck</p>
            <span className="text-slate-300">|</span>
            <button 
                onClick={handleCopyLink} 
                className="text-teal-600 hover:text-teal-800 text-xs font-bold flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full hover:bg-teal-100 transition-colors"
            >
                <Share2 className="w-3 h-3" /> Copiar Link para Pacientes
            </button>
          </div>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          <button 
            onClick={() => setTab('agenda')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'agenda' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Agenda
          </button>
          <button 
            onClick={() => setTab('services')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'services' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Briefcase className="w-4 h-4" /> Servicios
          </button>
          <button 
            onClick={() => setTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'settings' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Settings className="w-4 h-4" /> Configuración
          </button>
        </div>
      </header>

      {tab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Agenda Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TODAY'S REMINDERS PANEL */}
            {todaysAppointments.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-white rounded-xl p-4 border border-teal-200 shadow-sm">
                    <h3 className="text-teal-800 font-bold flex items-center gap-2 mb-3">
                        <Bell className="w-5 h-5" /> Recordatorios de Hoy ({todayStr})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {todaysAppointments.map(app => (
                            <div key={`reminder-${app.id}`} className="bg-white p-3 rounded-lg border border-teal-100 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{app.patientName}</p>
                                    <p className="text-xs text-slate-500">{app.time} hs - {getServiceDetails(app.serviceId)?.name}</p>
                                </div>
                                <button 
                                    onClick={() => sendWhatsAppReminder(app, true)}
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md transition-all"
                                    title="Enviar Recordatorio Ahora"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-teal-600" />
                  Turnos Agendados
                </h3>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-800"
                />
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No hay turnos programados para esta fecha.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map(app => {
                    const service = getServiceDetails(app.serviceId);
                    const isToday = app.date === todayStr;
                    return (
                      <div key={app.id} className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border transition-all ${app.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-md'}`}>
                        <div className="flex items-center sm:flex-col sm:justify-center sm:min-w-[100px] text-slate-700 bg-slate-50 rounded-md p-2">
                          <span className="text-lg font-bold">{app.time}</span>
                          <span className="text-xs text-slate-400 hidden sm:block">hasta {app.endTime || '?'}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg">{app.patientName}</h4>
                              <p className="text-sm text-teal-700 font-medium flex items-center gap-1">
                                {service?.name} 
                                <span className="text-slate-400 font-normal text-xs">({service?.durationMinutes} min)</span>
                              </p>
                              {service?.doctor && <span className="text-xs bg-slate-100 text-slate-500 px-1 rounded">{service.doctor}</span>}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              app.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                              app.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                            }`}>
                              {app.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                            </span>
                          </div>
                          <div className="mt-3 text-sm text-slate-500 flex flex-col gap-1">
                             <span className="flex items-center gap-2"><User className="w-3 h-3" /> {app.patientPhone}</span>
                             {app.notes && <p className="italic text-slate-500 bg-slate-50 p-2 rounded mt-2 text-xs">Nota: "{app.notes}"</p>}
                          </div>
                        </div>

                        <div className="flex sm:flex-col justify-end gap-2 mt-2 sm:mt-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
                          {app.status === 'confirmed' && (
                            <button 
                                onClick={() => sendWhatsAppReminder(app, isToday)}
                                className="text-green-600 hover:bg-green-50 p-2 rounded-md transition-colors flex items-center gap-2"
                                title={isToday ? "Enviar Recordatorio de HOY" : "Enviar Confirmación de Turno"}
                            >
                                <MessageCircle className="w-5 h-5" /> <span className="sm:hidden text-sm font-medium">WhatsApp</span>
                            </button>
                          )}
                          
                          {app.status !== 'cancelled' && (
                            <button 
                              onClick={() => onStatusChange(app.id, 'cancelled')}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors flex items-center gap-2"
                              title="Cancelar Turno"
                            >
                              <XCircle className="w-5 h-5" /> <span className="sm:hidden text-sm font-medium">Cancelar</span>
                            </button>
                          )}
                          {app.status === 'cancelled' && (
                            <button 
                              onClick={() => onStatusChange(app.id, 'confirmed')}
                              className="text-green-500 hover:bg-green-50 p-2 rounded-md transition-colors flex items-center gap-2"
                              title="Reactivar Turno"
                            >
                              <CheckCircle className="w-5 h-5" /> <span className="sm:hidden text-sm font-medium">Reactivar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / AI Insights */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-teal-500 rounded-full blur-3xl opacity-20"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Asistente IA
                </h3>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all flex items-center gap-1"
                >
                  {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Analizar'}
                </button>
              </div>
              
              <div className="min-h-[150px] text-sm leading-relaxed text-slate-300 relative z-10">
                {aiAnalysis ? (
                  <div className="prose prose-invert prose-sm">
                    <p className="whitespace-pre-line">{aiAnalysis}</p>
                  </div>
                ) : (
                  <p className="italic opacity-60">
                    Utiliza Gemini para analizar la carga de trabajo del día seleccionado, estimar ingresos y recibir sugerencias operativas.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wider">Métricas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-2xl font-bold text-teal-700">{appointments.filter(a => a.status === 'confirmed').length}</span>
                  <span className="text-xs text-slate-500 font-medium">Turnos Totales</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-2xl font-bold text-slate-700">{appointments.filter(a => a.status === 'cancelled').length}</span>
                  <span className="text-xs text-slate-500 font-medium">Cancelaciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Gestión de Servicios</h3>
              <p className="text-sm text-slate-500">Modifica precios, duración y detalles de tus prestaciones.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button 
                    onClick={handleRestore}
                    className="flex-1 sm:flex-none border border-slate-300 text-slate-600 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                    <RefreshCcw className="w-4 h-4" /> Restaurar Servicios
                </button>
                <button 
                    onClick={handleAddService}
                    className="flex-1 sm:flex-none bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-md font-bold text-sm"
                >
                    <PlusCircle className="w-4 h-4" /> Nuevo Servicio
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {services.map(service => (
               <div key={service.id} className="border border-slate-200 rounded-xl p-4 hover:border-teal-300 transition-all bg-slate-50 group relative">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase bg-white px-2 py-0.5 rounded text-slate-400 border border-slate-100 mb-1 inline-block">
                          {service.doctor || 'Dr. De Boeck'}
                      </span>
                      <h4 className="font-bold text-slate-800 pr-8">{service.name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">
                           <Clock className="w-3 h-3 mr-1" /> {service.durationMinutes} min
                        </span>
                        <span className="flex items-center text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100 font-bold">
                           <DollarSign className="w-3 h-3 mr-1" /> {service.price.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                        onClick={() => setEditingService(service)}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                        title="Editar"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             ))}
          </div>

          {/* Edit/Create Service Modal (Inline) */}
          {editingService && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-slate-800">
                       {services.some(s => s.id === editingService.id) ? 'Editar Servicio' : 'Nuevo Servicio'}
                   </h3>
                   <button onClick={() => setEditingService(null)} className="text-slate-400 hover:text-slate-600">
                     <XCircle className="w-6 h-6" />
                   </button>
                </div>
                
                <form onSubmit={handleSaveService} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                    <input 
                      type="text" 
                      required
                      value={editingService.name}
                      onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                      placeholder="Ej: Blanqueamiento Dental"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Profesional Asignado</label>
                    <select 
                        value={editingService.doctor || 'Dr. De Boeck'}
                        onChange={(e) => setEditingService({...editingService, doctor: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                    >
                        <option value="Dr. De Boeck">Dr. De Boeck (Ortodoncia)</option>
                        <option value="Dra. Rojas">Dra. Rojas (Odontología Gral)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Precio (ARS)</label>
                      <input 
                        type="number" 
                        required
                        value={editingService.price}
                        onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
                      <input 
                        type="number" 
                        required
                        step="5"
                        value={editingService.durationMinutes}
                        onChange={(e) => setEditingService({...editingService, durationMinutes: Number(e.target.value)})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                    <textarea 
                      required
                      value={editingService.description}
                      onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none bg-white text-slate-900"
                      placeholder="Breve descripción del tratamiento..."
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 bg-white"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-lg shadow-teal-200/50"
                    >
                      {services.some(s => s.id === editingService.id) ? 'Guardar Cambios' : 'Crear Servicio'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="max-w-3xl mx-auto">
           {/* Logo Config */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
               <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Identidad del Consultorio</h3>
                        <p className="text-sm text-slate-500">Personaliza el logo que ven los pacientes.</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-2">
                        <img src={currentLogo} alt="Current Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-2 text-sm font-medium text-slate-700">Subir nuevo logo (JPG, PNG)</label>
                         <label className="inline-flex items-center cursor-pointer">
                            <div className="flex items-center justify-center py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors shadow-md">
                                <Upload className="w-4 h-4 mr-2" /> Seleccionar Archivo
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onUpdateLogo && handleImageUpload(e, onUpdateLogo)}
                            />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">Se recomienda una imagen cuadrada o redonda con fondo transparente.</p>
                    </div>
                </div>
           </div>

           {/* Schedule Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                <h3 className="text-xl font-bold text-slate-800">Días y Horarios de Atención</h3>
                <p className="text-sm text-slate-500">Configura los días laborales y el rango horario disponible para turnos.</p>
                </div>
                <button 
                onClick={handleSaveSettings}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-sm"
                >
                <Save className="w-4 h-4" /> Guardar Cambios
                </button>
            </div>

            <div className="space-y-4">
                {DAYS_OF_WEEK.map((dayName, index) => {
                const config = tempSchedule[index] || { enabled: false, start: "09:00", end: "18:00" };
                
                return (
                    <div key={index} className={`flex items-center gap-4 p-4 rounded-lg border ${config.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-60'}`}>
                    <div className="w-32">
                        <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={config.enabled}
                            onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                        />
                        <span className={`font-medium ${config.enabled ? 'text-slate-800' : 'text-slate-500'}`}>{dayName}</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-bold w-10">Inicio</span>
                        <input 
                            type="time" 
                            disabled={!config.enabled}
                            value={config.start}
                            onChange={(e) => handleScheduleChange(index, 'start', e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100 bg-white text-slate-900"
                        />
                        </div>
                        <span className="text-slate-300">-</span>
                        <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-bold w-8">Fin</span>
                        <input 
                            type="time" 
                            disabled={!config.enabled}
                            value={config.end}
                            onChange={(e) => handleScheduleChange(index, 'end', e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100 bg-white text-slate-900"
                        />
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
