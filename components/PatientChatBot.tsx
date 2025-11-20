
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Service, WorkSchedule } from '../types';
import { GoogleGenAI } from "@google/genai";

interface PatientChatBotProps {
  services: Service[];
  workSchedule: WorkSchedule;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const PatientChatBot: React.FC<PatientChatBotProps> = ({ services, workSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy el asistente virtual del Consultorio Rojas-De Boeck. ¿En qué puedo ayudarte hoy? Pregúntame sobre tratamientos, precios o dudas dentales.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      // Preparar el contexto para la IA
      const context = `
        Eres un asistente amable y profesional del Consultorio Odontológico Rojas-De Boeck.
        
        DATOS DEL CONSULTORIO:
        - Doctores: Dr. Adolfo De Boeck (Ortodoncia) y Dra. Analía Rojas (Odontología General).
        - Servicios y Precios Actuales: ${JSON.stringify(services.map(s => `${s.name} ($${s.price})`))}.
        - Horarios: ${JSON.stringify(workSchedule)}.
        
        TU OBJETIVO:
        Responder preguntas de pacientes de forma breve, empática y clara.
        
        REGLAS:
        1. Si preguntan precios, usa SOLO los datos provistos.
        2. Si preguntan por dolor o diagnósticos médicos complejos, recomienda agendar una cita para evaluación.
        3. Sé amable, usa emojis ocasionalmente.
        4. Respuestas cortas (máximo 3 oraciones).
        
        Pregunta del paciente: "${userMessage}"
      `;

      // Llamada a la API (usando la misma config que ya tenías)
      const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
        ? process.env.API_KEY 
        : '';
      
      const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
      });

      const botResponse = response.text || "Lo siento, no pude procesar tu consulta en este momento. Por favor intenta agendar un turno.";
      
      setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    } catch (error) {
      console.error("Error chat:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Tuve un problema de conexión. Por favor intenta nuevamente o contáctanos por WhatsApp." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-teal-600 hover:bg-teal-700 hover:scale-110'}`}
      >
        {isOpen ? <X className="text-white w-6 h-6" /> : <MessageSquare className="text-white w-6 h-6" />}
      </button>

      {/* Ventana del Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-fade-in-up max-h-[500px]">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Asistente Virtual</h3>
              <p className="text-teal-100 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> En línea
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 h-80 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-teal-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50 text-slate-900"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              IA experimental. Para urgencias llame al consultorio.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
