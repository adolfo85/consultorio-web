
import React, { useState, useMemo } from 'react';
import { Service, Appointment, DoctorConfigMap } from '../types';
import { ServiceCard } from './ServiceCard';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

interface PatientBookingProps {
  services: Service[];
  existingAppointments: Appointment[];
  doctorConfigs: DoctorConfigMap;
  initialService?: Service | null;
  onBook: (appointment: Omit<Appointment, 'id' | 'status' | 'endTime'>) => void;
}

// Helper to convert "HH:mm" to minutes since midnight
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Helper to convert minutes to "HH:mm"
const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const PatientBooking: React.FC<PatientBookingProps> = ({ 
  services, 
  existingAppointments, 
  doctorConfigs,
  initialService, 
  onBook 
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialService ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which doctor's config to use based on selected service
  const activeDoctor = selectedService?.doctor || 'Dr. De Boeck';
  const activeConfig = doctorConfigs[activeDoctor] || doctorConfigs['Dr. De Boeck'];

  // Calculate dates for the next 30 days based on ACTIVE DOCTOR'S schedule
  const availableDates = useMemo(() => {
    if (!activeConfig) return [];

    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); 
      
      // Check specific doctor's schedule and blocked dates
      if (
        activeConfig.schedule[dayOfWeek] && 
        activeConfig.schedule[dayOfWeek].enabled && 
        !activeConfig.blockedDates.includes(dateString)
      ) {
        dates.push({
          fullDate: dateString,
          dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
          dayNumber: d.getDate(),
          month: d.toLocaleDateString('es-ES', { month: 'short' }),
          dayIndex: dayOfWeek
        });
      }
    }
    return dates;
  }, [activeConfig]);

  const generateTimeSlots = (dateStr: string, serviceDuration: number) => {
    if (!activeConfig) return [];

    const dayIndex = new Date(dateStr + 'T00:00:00').getDay();
    const schedule = activeConfig.schedule[dayIndex];
    
    if (!schedule || !schedule.enabled) return [];

    const startMins = timeToMinutes(schedule.start);
    const endMins = timeToMinutes(schedule.end);
    const slots: string[] = [];
    
    const interval = 30; 

    const dayApps = existingAppointments.filter(a => {
        const appService = services.find(s => s.id === a.serviceId);
        const appDoctor = appService?.doctor || 'Dr. De Boeck';
        return a.date === dateStr && a.status !== 'cancelled' && appDoctor === activeDoctor;
    });

    for (let time = startMins; time + serviceDuration <= endMins; time += interval) {
      const slotStart = time;
      const slotEnd = time + serviceDuration;
      
      const isBlocked = dayApps.some(app => {
        const appStart = timeToMinutes(app.time);
        const appEnd = app.endTime ? timeToMinutes(app.endTime) : appStart + 30;
        return (slotStart < appEnd) && (slotEnd > appStart);
      });

      if (!isBlocked) {
        slots.push(minutesToTime(slotStart));
      }
    }
    
    return slots;
  };

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    return generateTimeSlots(selectedDate, selectedService.durationMinutes);
  }, [selectedDate, selectedService, existingAppointments, activeConfig]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onBook({
        serviceId: selectedService.id,
        patientName: formData.name,
        patientEmail: formData.email,
        patientPhone: formData.phone,
        date: selectedDate,
        time: selectedTime,
        notes: formData.notes
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const formatPrice = (price: number) => {
      if (price === 0) return 'A consultar';
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  const deboeckServices = services.filter(s => !s.doctor || s.doctor === 'Dr. De Boeck');
  const rojasServices = services.filter(s => s.doctor === 'Dra. Rojas');

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-8">
      {/* Progress Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center px-4 sm:px-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
          <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">1</div>
          <span className="hidden sm:inline">Servicio</span>
        </div>
        <div className="h-[2px] bg-slate-200 w-8 sm:w-12"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
          <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">2</div>
          <span className="hidden sm:inline">Fecha</span>
        </div>
        <div className="h-[2px] bg-slate-200 w-8 sm:w-12"></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
          <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">3</div>
          <span className="hidden sm:inline">Datos</span>
        </div>
      </div>

      <div className="p-6 sm:p-8 min-h-[400px]">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-teal-600 rounded-full"></span>
                    Dr. De Boeck - Ortodoncia
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deboeckServices.map(service => (
                    <ServiceCard 
                    key={service.id} 
                    service={service} 
                    selected={selectedService?.id === service.id}
                    onSelect={handleServiceSelect}
                    />
                ))}
                {deboeckServices.length === 0 && <p className="text-slate-400 italic">No hay servicios disponibles.</p>}
                </div>
            </div>

            {rojasServices.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                        Dra. Analía Rojas - Odontología Gral.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rojasServices.map(service => (
                        <ServiceCard 
                        key={service.id} 
                        service={service} 
                        selected={selectedService?.id === service.id}
                        onSelect={handleServiceSelect}
                        />
                    ))}
                    </div>
                </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(1)} className="text-sm text-slate-500 flex items-center mb-4 hover:text-teal-700">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Elige Fecha y Hora</h2>
                <p className="text-slate-500">
                    Para: <span className="font-semibold text-teal-700">{selectedService?.name}</span> ({selectedService?.durationMinutes} min)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Agenda de: <strong>{activeDoctor}</strong>
                </p>
            </div>

            {/* Date Scroller */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {availableDates.length === 0 && <p className="text-slate-400">No hay fechas disponibles para este profesional (revisa días bloqueados).</p>}
              {availableDates.map((d) => (
                <button
                  key={d.fullDate}
                  onClick={() => handleDateSelect(d.fullDate)}
                  className={`
                    flex-shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-all
                    ${selectedDate === d.fullDate 
                      ? 'border-teal-600 bg-teal-700 text-white shadow-lg scale-105' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}
                  `}
                >
                  <span className="text-xs font-medium uppercase opacity-80">{d.dayName}</span>
                  <span className="text-2xl font-bold my-1">{d.dayNumber}</span>
                  <span className="text-xs opacity-80">{d.month}</span>
                </button>
              ))}
            </div>

            {selectedDate && (
              <div className="animate-fade-in-up">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Horarios Disponibles
                </h3>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
                    No hay horarios disponibles para este servicio en esta fecha.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`
                          py-2 px-4 rounded-lg text-sm font-medium border transition-all
                          ${selectedTime === time
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700'}
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="bg-teal-600 text-white py-3 px-8 rounded-full font-bold shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:shadow-none hover:bg-teal-700 transition-all flex items-center"
              >
                Continuar <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Details */}
        {step === 3 && selectedService && (
          <div className="animate-fade-in">
             <button onClick={() => setStep(2)} className="text-sm text-slate-500 flex items-center mb-4 hover:text-teal-700">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Summary Card */}
              <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                <h3 className="font-bold text-slate-800 mb-4">Resumen del Turno</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">Profesional</p>
                    <p className="font-medium text-slate-900">{selectedService.doctor || 'Dr. De Boeck'}</p>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">Tratamiento</p>
                    <p className="font-medium text-slate-900">{selectedService.name}</p>
                    <p className="text-teal-700 font-bold mt-1">{formatPrice(selectedService.price)}</p>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">Fecha</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">Hora</p>
                    <p className="font-medium text-slate-900">{selectedTime} hs</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Tus Datos</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opcional)</label>
                    <input 
                      type="email" 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                      placeholder="juan@ejemplo.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-900"
                      placeholder="11 1234 5678"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nota Opcional</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none bg-white text-slate-900"
                    placeholder="Primera vez, dolor de muela, etc..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Confirmando...
                    </>
                  ) : (
                    <>
                      Confirmar Turno <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
