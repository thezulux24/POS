import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  FileText,
  PieChart,
  Activity,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportsView = () => {
  const [activeSection, setActiveSection] = useState('reports');
  const [reportType, setReportType] = useState('ventas');
  const [reportLoading, setReportLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [period, setPeriod] = useState('day');
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const pointsByPeriod = {
    day: 7,
    week: 8,
    month: 6,
  };

  const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatShortLabel = (date) =>
    new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' })
      .format(date)
      .replace('.', '');

  const formatMonthLabel = (date) =>
    new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' })
      .format(date)
      .replace('.', '');

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekEnd = (weekStart) => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const buildSeriesFromDetailed = (rows, selectedPeriod, points) => {
    const now = new Date();
    const buckets = [];

    for (let i = points - 1; i >= 0; i--) {
      let start;
      let end;
      let label;

      if (selectedPeriod === 'week') {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - i * 7);
        start = getWeekStart(weekDate);
        end = getWeekEnd(start);
        label = formatShortLabel(start);
      } else if (selectedPeriod === 'month') {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        label = formatMonthLabel(start);
      } else {
        const dayDate = new Date(now);
        dayDate.setDate(now.getDate() - i);
        start = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0);
        end = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);
        label = formatShortLabel(start);
      }

      buckets.push({
        start,
        end,
        label,
        total: 0,
        salesCount: 0,
      });
    }

    rows.forEach((row) => {
      const saleDate = new Date(String(row.date).replace(' ', 'T'));
      if (Number.isNaN(saleDate.getTime())) return;

      const bucket = buckets.find((item) => saleDate >= item.start && saleDate <= item.end);
      if (!bucket) return;

      bucket.total += Number(row.total || 0);
      bucket.salesCount += 1;
    });

    return buckets.map((bucket) => ({
      label: bucket.label,
      total: bucket.total,
      salesCount: bucket.salesCount,
    }));
  };

  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      const response = await reportService.getDetailedReport(
        dateRange.start,
        dateRange.end,
      );
      setData(response);
    } catch (err) {
      console.error(err);
      alert('Error al cargar datos del reporte. Asegurate de que el backend este actualizado.');
    } finally {
      setReportLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!data || data.length === 0) {
      alert('Primero genera la vista previa para exportar.');
      return;
    }

    setReportLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Reporte de Ventas - Sistema POS', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Periodo: ${dateRange.start} a ${dateRange.end}`, 14, 30);

      const tableRows = data.map((item) => [
        item.date,
        'Venta Diaria',
        new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(item.total),
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
      setReportLoading(false);
    }
  };

  const generateExcel = () => {
    if (!data || data.length === 0) {
      alert('Primero genera la vista previa para exportar.');
      return;
    }

    try {
      const excelRows = data.map((item) => ({
        Fecha: item.date,
        Tipo: 'Venta Diaria',
        Total: Number(item.total),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
      XLSX.writeFile(workbook, `reporte-${reportType}-${dateRange.start}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Error al generar Excel');
    }
  };

  const loadCharts = async () => {
    setChartsLoading(true);
    setChartsError('');
    try {
      const [salesResponse, topResponse] = await Promise.all([
        reportService.getSalesByPeriod(period, pointsByPeriod[period]),
        reportService.getTopProductsByPeriod(period, 8),
      ]);

      setSalesData(salesResponse.data || []);
      setTopProducts(topResponse.items || []);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 404) {
        try {
          const points = pointsByPeriod[period];
          const end = new Date();
          let start = new Date(end);

          if (period === 'week') {
            start.setDate(end.getDate() - points * 7);
          } else if (period === 'month') {
            start = new Date(end.getFullYear(), end.getMonth() - points + 1, 1);
          } else {
            start.setDate(end.getDate() - points + 1);
          }

          const [detailedRows, legacyTopProducts] = await Promise.all([
            reportService.getDetailedReport(formatDateForApi(start), formatDateForApi(end)),
            reportService.getTopProducts(8),
          ]);

          setSalesData(buildSeriesFromDetailed(detailedRows || [], period, points));
          setTopProducts(
            (legacyTopProducts || []).map((item, index) => ({
              productId: item.productId || index + 1,
              nombre: item.nombre,
              cantidadVendida: item.cantidadVendida,
              ingresosTotales: item.ingresosTotales,
            })),
          );
          return;
        } catch (fallbackErr) {
          console.error(fallbackErr);
        }
      }

      if (status === 401 || status === 403) {
        setChartsError('No autorizado para ver graficas. Inicia sesion nuevamente con un usuario ADMIN.');
      } else {
        setChartsError('Error al cargar graficas. Verifica backend, base de datos y token de sesion.');
      }
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    void loadCharts();
  }, [period]);

  const maxSales = useMemo(
    () => Math.max(...salesData.map((item) => item.total || 0), 1),
    [salesData],
  );

  const maxTopSold = useMemo(
    () => Math.max(...topProducts.map((item) => item.cantidadVendida || 0), 1),
    [topProducts],
  );

  const priceFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  });

  const periodLabel = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mes',
  };

  const sidePanelStyle = {
    minHeight: '246px',
  };

  const fullWidthButtonStyle = {
    marginTop: '10px',
    minHeight: '42px',
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
            <p className="terminal-subtitle">Genera informes profesionales y consulta graficas de ventas.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel" style={{ marginBottom: '18px' }}>
        <div className="terminal-actions-bar" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            className="terminal-primary-btn terminal-primary-btn-full"
            style={activeSection === 'reports' ? {} : { background: '#ffffff', color: '#111827', border: '1px solid #94a3b8' }}
            onClick={() => setActiveSection('reports')}
          >
            Reportes
          </button>
          <button
            className="terminal-primary-btn terminal-primary-btn-full"
            style={activeSection === 'charts' ? {} : { background: '#ffffff', color: '#111827', border: '1px solid #94a3b8' }}
            onClick={() => setActiveSection('charts')}
          >
            Graficas
          </button>
        </div>
      </section>

      {activeSection === 'reports' && (
        <div className="terminal-admin-grid">
          <aside className="terminal-stack">
            <section className="terminal-panel" style={sidePanelStyle}>
              <h2 className="terminal-panel-title">Parametros del Informe</h2>
              <div className="terminal-field-group">
                 <span className="terminal-mini-label">Tipo de Reporte</span>
                 <div className="terminal-field">
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                       <option value="ventas">Ventas por Periodo</option>
                       <option value="stock">Movimientos de Inventario</option>
                       <option value="clientes">Actividad de Clientes</option>
                    </select>
                 </div>
              </div>

              <div className="terminal-form-grid">
                 <div className="terminal-field-group">
                    <span className="terminal-mini-label">Inicio</span>
                    <div className="terminal-field">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            start: e.target.value,
                          })
                        }
                      />
                    </div>
                 </div>
                 <div className="terminal-field-group">
                    <span className="terminal-mini-label">Fin</span>
                    <div className="terminal-field">
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            end: e.target.value,
                          })
                        }
                      />
                    </div>
                 </div>
              </div>

              <button
                className="terminal-primary-btn terminal-primary-btn-full"
                style={fullWidthButtonStyle}
                onClick={fetchReportData}
                disabled={reportLoading}
              >
                 <Activity size={15} /> {reportLoading ? 'Cargando...' : 'Generar Vista Previa'}
              </button>
            </section>

            <section
              className="terminal-panel"
              style={{
                ...sidePanelStyle,
                background: '#111827',
                color: 'white',
                border: 'none',
                minHeight: '50px',
                width: '95%',
                alignSelf: 'center',
              }}
            >
               <div className="terminal-panel-header" style={{ alignItems: 'center' }}>
                 <h2 className="terminal-panel-title" style={{ color: 'white' }}>Exportacion</h2>
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <button
                     className="terminal-ghost-btn"
                     style={{
                       background: 'rgba(255,255,255,0.05)',
                       color: 'white',
                       border: '1px solid rgba(255,255,255,0.1)',
                       minHeight: '42px',
                     }}
                     onClick={generatePDF}
                     disabled={reportLoading || data.length === 0}
                   >
                      <FileText size={18} /> {reportLoading ? '...' : 'PDF'}
                   </button>
                   <button
                     className="terminal-ghost-btn"
                     style={{
                       background: 'rgba(255,255,255,0.05)',
                       color: 'white',
                       border: '1px solid rgba(255,255,255,0.1)',
                       minHeight: '42px',
                     }}
                     onClick={generateExcel}
                     disabled={reportLoading || data.length === 0}
                   >
                      <FileText size={18} /> Excel
                   </button>
                 </div>
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
                         <span className="text-right font-bold">
                           {new Intl.NumberFormat('es-CO', {
                             style: 'currency',
                             currency: 'COP',
                           }).format(item.total)}
                         </span>
                      </div>
                   ))}
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: 0.3 }}>
                   <PieChart size={64} style={{ marginBottom: '16px' }} />
                   <h3 className="terminal-panel-title">Previsualizacion de Reporte</h3>
                   <p className="terminal-panel-sub">Selecciona un rango y genera el reporte para ver los datos reales.</p>
                </div>
             )}
          </section>
        </div>
      )}

      {activeSection === 'charts' && (
        <div className="terminal-admin-grid">
          <aside className="terminal-stack">
            <section className="terminal-panel" style={sidePanelStyle}>
              <h2 className="terminal-panel-title">Graficas Adicionales</h2>
              <div className="terminal-field-group">
                 <span className="terminal-mini-label">Agrupar Ventas Por</span>
                 <div className="terminal-field">
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                       <option value="day">Dia</option>
                       <option value="week">Semana</option>
                       <option value="month">Mes</option>
                    </select>
                 </div>
              </div>

              <button
                className="terminal-primary-btn terminal-primary-btn-full"
                style={fullWidthButtonStyle}
                onClick={loadCharts}
                disabled={chartsLoading}
              >
                 <Activity size={15} /> {chartsLoading ? 'Cargando...' : 'Actualizar Graficas'}
              </button>

              <p className="terminal-panel-sub">
                Vista actual: {periodLabel[period]} | Ventanas: {pointsByPeriod[period]}
              </p>

              {chartsError && <p className="terminal-feedback-error">{chartsError}</p>}
            </section>

            <section className="terminal-panel" style={{ minHeight: '360px' }}>
              <div>
                <h3 className="terminal-panel-title">Grafica de Ventas ({periodLabel[period]})</h3>
                <p className="terminal-panel-sub">Comparativo de ingresos y numero de transacciones por bloque de tiempo.</p>
              </div>

              {salesData.length > 0 ? (
                <>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${salesData.length}, minmax(0, 1fr))`,
                    gap: '10px',
                    alignItems: 'end',
                    minHeight: '240px',
                    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 70%)',
                  }}>
                    {salesData.map((item, idx) => {
                      const height = Math.max((item.total / maxSales) * 180, 8);
                      return (
                        <div key={`${item.label}-${idx}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'end', gap: '6px' }}>
                          <div
                            title={`${item.label}: ${priceFormatter.format(item.total)}`}
                            style={{
                              height: `${height}px`,
                              borderRadius: '10px 10px 6px 6px',
                              background: 'linear-gradient(180deg, #0f766e 0%, #115e59 100%)',
                            }}
                          />
                          <span style={{ fontSize: '11px', textAlign: 'center', color: '#475569' }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="terminal-table">
                    <div className="terminal-head" style={{ '--columns': '1fr 1fr 1fr' }}>
                      <span>Bloque</span>
                      <span>Ventas</span>
                      <span>Total</span>
                    </div>
                    {salesData.map((item, idx) => (
                      <div key={`${item.label}-row-${idx}`} className="terminal-row" style={{ '--columns': '1fr 1fr 1fr' }}>
                        <span>{item.label}</span>
                        <span>{item.salesCount}</span>
                        <span className="font-bold">{priceFormatter.format(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="terminal-panel-sub">Sin datos de ventas en este periodo.</p>
              )}
            </section>
          </aside>

          <section className="terminal-panel" style={{ minHeight: '360px' }}>
            <h3 className="terminal-panel-title">Productos Mas Vendidos ({periodLabel[period]})</h3>

            {topProducts.length === 0 ? (
              <p className="terminal-panel-sub">Sin ventas registradas en este periodo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topProducts.map((item) => {
                  const width = `${Math.max((item.cantidadVendida / maxTopSold) * 100, 6)}%`;
                  return (
                    <div key={item.productId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <strong>{item.nombre}</strong>
                        <span>{item.cantidadVendida} uds</span>
                      </div>
                      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '999px' }}>
                        <div
                          style={{
                            width,
                            height: '100%',
                            borderRadius: '999px',
                            background: 'linear-gradient(90deg, #34d399, #10b981)',
                          }}
                        />
                      </div>
                      <span className="terminal-panel-sub">{priceFormatter.format(item.ingresosTotales)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
