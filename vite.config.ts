import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno del nivel raíz (incluyendo API_KEY)
  // Fix: Cast process to any to avoid TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Inyectamos explícitamente la API Key para que esté disponible en el navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Mantenemos el polyfill vacío para el resto de process.env para evitar la pantalla blanca
      // Nota: Definir la key específica arriba asegura que no sea sobrescrita por este objeto vacío
      'process.env': {} 
    }
  }
})