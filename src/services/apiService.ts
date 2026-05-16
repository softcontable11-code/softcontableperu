/**
 * Servicio centralizado para consultas API externas.
 * Centraliza el token y la lógica de consulta para evitar
 * exposición de tokens en múltiples componentes.
 */

// Token centralizado — en producción debería venir de env vars
const API_TOKEN = import.meta.env.VITE_API_PERU_TOKEN || 
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFhbmdlbG8yNTU1QGdtYWlsLmNvbSJ9.oqXPZP_ielNYSWrNo9p45PUjua1IHKIJ3gBj-tK2irY';

const API_BASE_URL = 'https://dniruc.apisperu.com/api/v1';

export interface RucResponse {
  ruc: string;
  razonSocial: string;
  estado: string;
  condicion: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  tipo: string;
}

export interface DniResponse {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

/**
 * Consulta RUC en API externa
 */
export async function consultarRUC(ruc: string): Promise<RucResponse | null> {
  if (ruc.length !== 11) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/ruc/${ruc}?token=${API_TOKEN}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.razonSocial) return data as RucResponse;
    }
  } catch (error) {
    console.error('Error consultando RUC:', error);
  }
  return null;
}

/**
 * Consulta DNI en API externa
 */
export async function consultarDNI(dni: string): Promise<DniResponse | null> {
  if (dni.length !== 8) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/dni/${dni}?token=${API_TOKEN}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.nombres) return data as DniResponse;
    }
  } catch (error) {
    console.error('Error consultando DNI:', error);
  }
  return null;
}

/**
 * Valida el dígito verificador de un RUC peruano (módulo 11)
 */
export function validarRUC(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  
  // Prefijos válidos: 10 (persona natural), 15 (no domiciliado), 
  // 17 (no domiciliado sin RUC), 20 (jurídica)
  const prefix = ruc.substring(0, 2);
  if (!['10', '15', '17', '20'].includes(prefix)) return false;

  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(ruc[i]) * factores[i];
  }
  const residuo = 11 - (suma % 11);
  const digitoVerificador = residuo === 10 ? 0 : residuo === 11 ? 1 : residuo;
  
  return digitoVerificador === parseInt(ruc[10]);
}

/**
 * Valida un DNI peruano (solo formato)
 */
export function validarDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

/**
 * Auto-detecta el tipo de documento de identidad por longitud
 */
export function detectarTipoDoc(docNum: string): string {
  const cleaned = docNum.replace(/\D/g, '');
  if (cleaned.length === 11) return '6'; // RUC
  if (cleaned.length === 8) return '1';  // DNI
  if (cleaned.length === 12) return '4'; // Carnet Extranjería
  return '0'; // Otros
}

/**
 * Busca el nombre de un contribuyente por RUC o DNI.
 * Primero busca localmente en entities, luego consulta API.
 */
export async function buscarContribuyente(
  docNum: string, 
  docTipo: string,
  entities: Array<{ ruc: string; descripcion: string }>
): Promise<string | null> {
  // Búsqueda local primero
  const entity = entities.find(e => e.ruc === docNum);
  if (entity) return entity.descripcion;

  // Búsqueda API
  if (docTipo === '6' && docNum.length === 11) {
    const data = await consultarRUC(docNum);
    if (data) return data.razonSocial;
  } else if (docTipo === '1' && docNum.length === 8) {
    const data = await consultarDNI(docNum);
    if (data) return `${data.apellidoPaterno} ${data.apellidoMaterno} ${data.nombres}`;
  }

  return null;
}
