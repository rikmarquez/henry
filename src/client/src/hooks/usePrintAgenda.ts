import { useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import PrintableDailyAgenda from '../components/print/PrintableDailyAgenda';
import PrintableWeeklyAgenda from '../components/print/PrintableWeeklyAgenda';

interface Appointment {
  id: number;
  scheduledDate: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isFromOpportunity: boolean;
  client: {
    id: number;
    name: string;
    phone: string;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
  };
}

interface UsePrintAgendaProps {
  branchName?: string;
}

export const usePrintAgenda = ({ branchName = "Henry Diagnostics" }: UsePrintAgendaProps = {}) => {
  const printContainerRef = useRef<HTMLDivElement | null>(null);

  const createPrintWindow = useCallback(() => {
    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión. Verifique que las ventanas emergentes estén habilitadas.');
    }

    return printWindow;
  }, []);

  const setupPrintWindow = useCallback((printWindow: Window, title: string) => {
    // Configurar el documento de la ventana de impresión
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
            }
            #print-root {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Copiar todos los estilos de la ventana principal
    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach(stylesheet => {
      try {
        if (stylesheet.href) {
          // Enlace externo
          const link = printWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = stylesheet.href;
          printWindow.document.head.appendChild(link);
        } else if (stylesheet.cssRules) {
          // Estilos inline
          const style = printWindow.document.createElement('style');
          const cssText = Array.from(stylesheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
          style.textContent = cssText;
          printWindow.document.head.appendChild(style);
        }
      } catch (e) {
        console.warn('No se pudo copiar hoja de estilos:', e);
      }
    });

    return printWindow;
  }, []);

  const printDailyAgenda = useCallback(async (
    appointments: Appointment[],
    selectedDate: Date
  ) => {
    try {
      const printWindow = createPrintWindow();
      const title = `Agenda Diaria - ${selectedDate.toLocaleDateString('es-MX')} - ${branchName}`;

      setupPrintWindow(printWindow, title);

      // Esperar a que se cargue la ventana
      await new Promise(resolve => {
        if (printWindow.document.readyState === 'complete') {
          resolve(true);
        } else {
          printWindow.addEventListener('load', resolve);
        }
      });

      // Renderizar el componente React en la nueva ventana
      const printRoot = printWindow.document.getElementById('print-root');
      if (printRoot) {
        const root = createRoot(printRoot);

        // Renderizar el componente
        root.render(
          PrintableDailyAgenda({
            appointments,
            selectedDate,
            branchName
          })
        );

        // Esperar un momento para que se renderice completamente
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();

          // Cerrar la ventana después de imprimir (opcional)
          printWindow.addEventListener('afterprint', () => {
            printWindow.close();
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error al imprimir agenda diaria:', error);
      throw new Error('No se pudo imprimir la agenda diaria. Por favor, inténtelo de nuevo.');
    }
  }, [branchName, createPrintWindow, setupPrintWindow]);

  const printWeeklyAgenda = useCallback(async (
    appointments: Appointment[],
    selectedDate: Date
  ) => {
    try {
      const printWindow = createPrintWindow();

      // Calcular rango de semana para el título
      const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
      };

      const weekStart = getWeekStart(selectedDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const title = `Agenda Semanal - ${weekStart.toLocaleDateString('es-MX')} al ${weekEnd.toLocaleDateString('es-MX')} - ${branchName}`;

      setupPrintWindow(printWindow, title);

      // Esperar a que se cargue la ventana
      await new Promise(resolve => {
        if (printWindow.document.readyState === 'complete') {
          resolve(true);
        } else {
          printWindow.addEventListener('load', resolve);
        }
      });

      // Renderizar el componente React en la nueva ventana
      const printRoot = printWindow.document.getElementById('print-root');
      if (printRoot) {
        const root = createRoot(printRoot);

        // Renderizar el componente
        root.render(
          PrintableWeeklyAgenda({
            appointments,
            selectedDate,
            branchName
          })
        );

        // Esperar un momento para que se renderice completamente
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();

          // Cerrar la ventana después de imprimir (opcional)
          printWindow.addEventListener('afterprint', () => {
            printWindow.close();
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error al imprimir agenda semanal:', error);
      throw new Error('No se pudo imprimir la agenda semanal. Por favor, inténtelo de nuevo.');
    }
  }, [branchName, createPrintWindow, setupPrintWindow]);

  // Método alternativo usando el DOM actual (más simple, pero menos control)
  const printCurrentView = useCallback((elementSelector: string) => {
    const element = document.querySelector(elementSelector);
    if (!element) {
      throw new Error('No se encontró el elemento a imprimir');
    }

    // Ocultar otros elementos
    const originalContents = document.body.innerHTML;
    const printContents = element.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;

    // Recargar la página para restaurar los event listeners
    window.location.reload();
  }, []);

  return {
    printDailyAgenda,
    printWeeklyAgenda,
    printCurrentView,
    isSupported: typeof window !== 'undefined' && 'print' in window
  };
};

export default usePrintAgenda;