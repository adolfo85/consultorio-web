import { GoogleGenAI } from "@google/genai";
import { Appointment, Service } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSchedule = async (
  appointments: Appointment[],
  services: Service[],
  date: string
): Promise<string> => {
  try {
    // Filter appointments for the specific date or week if needed, 
    // but for this demo we pass the context of "upcoming"
    
    const relevantAppointments = appointments.filter(app => app.status === 'confirmed');
    
    const prompt = `
      Actúa como un asistente administrativo experto para un consultorio de ortodoncia.
      Analiza la siguiente lista de citas confirmadas y provee un resumen ejecutivo breve (máximo 3 oraciones) y 2 recomendaciones clave para el doctor.
      
      Fecha de análisis: ${date}
      
      Datos de Servicios:
      ${JSON.stringify(services)}
      
      Citas Agendadas:
      ${JSON.stringify(relevantAppointments)}
      
      Si no hay citas, sugiere acciones de marketing. Responde en español profesional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "El servicio de IA no está disponible temporalmente.";
  }
};

export const generateServiceDescription = async (serviceName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Escribe una descripción corta, atractiva y profesional (max 120 caracteres) para un servicio de ortodoncia llamado "${serviceName}". En español.`
        });
        return response.text || "Servicio odontológico de alta calidad.";
    } catch (e) {
        return "Servicio odontológico de alta calidad.";
    }
}