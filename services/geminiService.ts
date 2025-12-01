import { GoogleGenAI } from "@google/genai";
import { Appointment, Service } from "../types";

// Helper para obtener la instancia de IA de forma segura y perezosa (lazy)
// Esto evita que la aplicación explote al cargar si process.env no existe
const getAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
    ? process.env.API_KEY 
    : '';
    
  // Si no hay key, la instancia se crea igual pero fallará controladamente al usarse
  return new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
};

export const analyzeSchedule = async (
  appointments: Appointment[],
  services: Service[],
  date: string
): Promise<string> => {
  try {
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

    // Inicializamos la IA aquí dentro, solo cuando se necesita
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "El servicio de IA no está disponible. (Verifique la configuración de API Key)";
  }
};

export const generateServiceDescription = async (serviceName: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Escribe una descripción corta, atractiva y profesional (max 120 caracteres) para un servicio de ortodoncia llamado "${serviceName}". En español.`
        });
        return response.text || "Servicio odontológico de alta calidad.";
    } catch (e) {
        return "Servicio odontológico de alta calidad.";
    }
}