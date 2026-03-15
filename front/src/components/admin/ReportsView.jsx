import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Table as TableIcon,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportsView = () => {
  const [reportType, setReportType] = useState('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getDetailedReport(dateRange.start, dateRange.end); 
      setData(response);
    } catch (err) {
      console.error(err);
      alert('Error al cargar datos del reporte. Asegúrate de que el backend esté actualizado.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!data || data.length === 0) {
      alert('Primero genera la vista previa para exportar.');
      return;
    }
    setLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Reporte de Ventas - Sistema POS', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Periodo: ${dateRange.start} a ${dateRange.end}`, 14, 30);
      
      const tableRows = data.map(item => [
        item.date,
        'Venta Diaria',
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.total)
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Tipo', 'Total']],
        body: tableRows,
      });
      
      doc.save(`reporte-${reportType}-${dateRange.start}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <BarChart3 size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">BI & Analytics</span>
            <h1 className="terminal-title">Centro de Reportes</h1>
            <p className="terminal-subtitle">Genera informes profesionales y exporta datos (US016).</p>
          </div>
        </div>
      </header>

      <div className="terminal-admin-grid">
        <aside className="terminal-stack">
          <section className="terminal-panel">
            <h2 className="terminal-panel-title">Parámetros del Informe</h2>
            <div className="terminal-field-group">
               <span className="terminal-mini-label">Tipo de Reporte</span>
               <div className="terminal-field">
                  <select value={reportType} onChange={e => setReportType(e.target.value)}>
                     <option value="ventas">Ventas por Periodo</option>
                     <option value="stock">Movimientos de Inventario</option>
                     <option value="clientes">Actividad de Clientes</option>
                  </select>
               </div>
            </div>
            
            <div className="terminal-form-grid">
               <div className="terminal-field-group">
                  <span className="terminal-mini-label">Inicio</span>
                  <div className="terminal-field"><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} /></div>
               </div>
               <div className="terminal-field-group">
                  <span className="terminal-mini-label">Fin</span>
                  <div className="terminal-field"><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} /></div>
               </div>
            </div>

            <button className="terminal-primary-btn terminal-primary-btn-full" style={{ marginTop: '10px' }} onClick={fetchReportData} disabled={loading}>
               <Activity size={15} /> {loading ? 'Cargando...' : 'Generar Vista Previa'}
            </button>
          </section>

          <section className="terminal-panel" style={{ background: '#111827', color: 'white', border: 'none' }}>
             <h2 className="terminal-panel-title" style={{ color: 'white' }}>Exportación</h2>
             <div className="terminal-actions-bar">
                <button className="terminal-ghost-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} onClick={generatePDF} disabled={loading || data.length === 0}>
                   <FileText size={18} /> {loading ? '...' : 'PDF'}
                </button>
             </div>
          </section>
        </aside>

        <section className="terminal-panel" style={{ minHeight: '400px' }}>
           {data.length > 0 ? (
              <div className="terminal-table">
                 <div className="terminal-head" style={{ '--columns': '1fr 1fr' }}>
                    <span>Fecha</span>
                    <span className="text-right">Total</span>
                 </div>
                 {data.map((item, idx) => (
                    <div key={idx} className="terminal-row" style={{ '--columns': '1fr 1fr' }}>
                       <span>{item.date}</span>
                       <span className="text-right font-bold">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.total)}</span>
                    </div>
                 ))}
              </div>
           ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: 0.3 }}>
                 <PieChart size={64} style={{ marginBottom: '16px' }} />
                 <h3 className="terminal-panel-title">Previsualización de Reporte</h3>
                 <p className="terminal-panel-sub">Selecciona un rango y genera el reporte para ver los datos reales.</p>
              </div>
           )}
        </section>
      </div>
    </div>
  );
};

export default ReportsView;
