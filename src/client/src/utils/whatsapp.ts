import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para los mensajes de WhatsApp
export interface WhatsAppMessageData {
  clientName: string;
  clientPhone: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  amount?: number;
  serviceName?: string;
  diagnosticResult?: string;
  followUpService?: string;
}

// Plantillas de mensajes
export const WhatsAppTemplates = {
  appointmentReminder: (data: WhatsAppMessageData) => `
🔧 *Henry's Diagnostics*

Hola ${data.clientName}, le recordamos que tiene una cita programada:

📅 *Fecha:* ${data.appointmentDate ? format(data.appointmentDate, "EEEE d 'de' MMMM", { locale: es }) : 'mañana'}
⏰ *Hora:* ${data.appointmentTime || '9:00 AM'}
🚗 *Vehículo:* ${data.vehicleBrand} ${data.vehicleModel} - ${data.vehiclePlate}

Por favor responda *CONFIRMO* para confirmar su cita.

¡Gracias por confiar en nosotros! 🚗✨
  `.trim(),

  quotationReady: (data: WhatsAppMessageData) => `
🔧 *Henry's Diagnostics*

Hola ${data.clientName}, tenemos buenas noticias:

✅ Ya está lista la cotización para su ${data.vehicleBrand} ${data.vehicleModel}
💰 *Monto:* $${data.amount?.toLocaleString('es-MX') || '0'} MXN

${data.diagnosticResult ? `🔍 *Diagnóstico:* ${data.diagnosticResult}` : ''}

¿Desea autorizar el trabajo? Responda *AUTORIZO* para proceder.

¡Estamos listos para atender su vehículo! 🚗🔧
  `.trim(),

  vehicleReady: (data: WhatsAppMessageData) => `
🔧 *Henry's Diagnostics*

¡Excelentes noticias ${data.clientName}!

✅ Su ${data.vehicleBrand} ${data.vehicleModel} (${data.vehiclePlate}) ya está listo
🎯 Trabajo completado exitosamente
💰 *Total:* $${data.amount?.toLocaleString('es-MX') || '0'} MXN

Puede pasar a recogerlo en nuestro horario:
🕘 Lunes a Viernes: 8:00 AM - 7:00 PM
🕘 Sábados: 8:00 AM - 2:00 PM

¡Gracias por confiar en Henry's Diagnostics! 🚗✨
  `.trim(),

  opportunityFollowUp: (data: WhatsAppMessageData) => `
🔧 *Henry's Diagnostics*

Hola ${data.clientName}, esperamos que esté bien.

Le recordamos que es importante realizar ${data.followUpService || 'el mantenimiento'} de su ${data.vehicleBrand} ${data.vehicleModel}.

📅 ¿Le gustaría agendar una cita?
🔧 Contamos con técnicos especializados
💯 Garantía en todos nuestros trabajos

Responda *CITA* para programar su visita.

¡Estamos aquí para cuidar su vehículo! 🚗✨
  `.trim(),

  generalContact: (data: WhatsAppMessageData) => `
🔧 *Henry's Diagnostics*

Hola ${data.clientName}, ¿cómo está?

Nos comunicamos de Henry's Diagnostics para darle seguimiento a su ${data.vehicleBrand} ${data.vehicleModel}.

¿En qué podemos ayudarle el día de hoy?

🔧 Diagnósticos especializados
🛠️ Reparaciones garantizadas
📅 Citas flexibles

¡Estamos para servirle! 🚗✨
  `.trim()
};

// Función para limpiar y formatear número de teléfono
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remover espacios, guiones y paréntesis
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Si no empieza con código de país, agregar México (+52)
  if (!cleanPhone.startsWith('52') && !cleanPhone.startsWith('+52')) {
    cleanPhone = '52' + cleanPhone;
  }

  // Remover el + si existe
  cleanPhone = cleanPhone.replace('+', '');

  return cleanPhone;
};

// Función principal para generar enlace de WhatsApp
export const generateWhatsAppLink = (
  phone: string,
  template: string,
  data: WhatsAppMessageData
): string => {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const message = template(data);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

// Funciones de conveniencia para cada tipo de mensaje
export const WhatsAppLinks = {
  appointmentReminder: (data: WhatsAppMessageData) =>
    generateWhatsAppLink(data.clientPhone, WhatsAppTemplates.appointmentReminder, data),

  quotationReady: (data: WhatsAppMessageData) =>
    generateWhatsAppLink(data.clientPhone, WhatsAppTemplates.quotationReady, data),

  vehicleReady: (data: WhatsAppMessageData) =>
    generateWhatsAppLink(data.clientPhone, WhatsAppTemplates.vehicleReady, data),

  opportunityFollowUp: (data: WhatsAppMessageData) =>
    generateWhatsAppLink(data.clientPhone, WhatsAppTemplates.opportunityFollowUp, data),

  generalContact: (data: WhatsAppMessageData) =>
    generateWhatsAppLink(data.clientPhone, WhatsAppTemplates.generalContact, data)
};

// Función para abrir WhatsApp (uso en componentes)
export const openWhatsApp = (link: string): void => {
  window.open(link, '_blank', 'noopener,noreferrer');
};