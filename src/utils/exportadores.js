import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────

const fmtBool = (v) => v ? '✓' : '✗';
const fmtOracion = (hrs, min) => { const h = Number(hrs) || 0; const m = Number(min) || 0; return (h === 0 && m === 0) ? '✗' : `${h} hr ${m} min`; };
const sumarOracion = (data) => {
  let totalMin = 0;
  for (const row of data) {
    totalMin += (Number(row.horasOracion) || 0) * 60 + (Number(row.minutosOracion) || 0);
  }
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return fmtOracion(horas, minutos);
};

const mapReporteRow = (r, idx) => ({
  'ÍTEM': idx + 1,
  'LÍDERES': r.liderNombre || `Líder ${r.liderId || ''}`,
  'DIEZMO': fmtBool(r.diezmo),
  'LEC. BIB.': fmtBool(r.lecturaBiblia),
  'ORACION': fmtOracion(r.horasOracion, r.minutosOracion),
  'VISITO': fmtBool(r.visito),
  'AYUNA': fmtBool(r.ayuno),
  'CANT. HERMANOS': r.cantHermanos || 0,
  'CANT. AMIGOS': r.cantAmigos || 0,
  'CANT. ADOLESCENTES': r.cantAdolescentes || 0,
  'TOTAL ASISTENCIA': (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0),
  'CANT. CONVERTIDOS': r.cantConvertidos || 0,
  'CANT. NIÑOS CRISTIANOS': r.cantNinosCristianos || 0,
  'CANT. NIÑOS AMIGOS': r.cantNinosAmigos || 0,
  'TOTAL NIÑOS': (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0),
  'VISITA CONSOLIDACIÓN': r.cantVisitaConsolidacion || 0,
  'VISITA CASA DE PAZ': r.cantVisitaCasaDePaz || 0,
  'VISITA HOGAR': r.cantVisitaHogar || 0,
  'HR EN ORACIÓN': r.cantHrOracion || 0,
  'HR. MEP': r.cantHrMep || 0,
  'HR. DISCIPULADO': r.cantHrDiscipulado || 0,
  'RETIRO ESPIRITUAL': r.cantRetiroEspiritual || 0,
  'CULTO CENT.': r.cantCultoCentral || 0,
  'OFRENDA SÁBADO': Number(r.ofrendaSabado || 0),
  'OFRENDA NIÑOS': Number(r.ofrendaNinos || 0),
  'OFRENDA MIÉRCOLES': Number(r.ofrendaMiercoles || 0),
  'TOTAL OFRENDA': Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0),
  'OBS.': r.observaciones
});

const sumField = (reportes, field) => reportes.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);

// ─────────────────────────────────────────────────────────
// Exportar consolidado por LÍDERES a Excel
// ─────────────────────────────────────────────────────────

export const exportConsolidadoExcel = (reportes, titulo = 'Consolidado', fileName = 'Consolidado') => {
  if (!reportes || reportes.length === 0) return;

  const rows = reportes.map(mapReporteRow);

  const total = {
    'ÍTEM': '',
    'LÍDERES': 'TOTAL',
    'DIEZMO': sumField(reportes, 'diezmo'),
    'LEC. BIB.': sumField(reportes, 'lecturaBiblia'),
    'ORACION': sumarOracion(reportes, 'horasOracion', 'minutosOracion'),
    'VISITO': sumField(reportes, 'visito'),
    'AYUNA': sumField(reportes, 'ayuno'),
    'CANT. HERMANOS': sumField(reportes, 'cantHermanos'),
    'CANT. AMIGOS': sumField(reportes, 'cantAmigos'),
    'CANT. ADOLESCENTES': sumField(reportes, 'cantAdolescentes'),
    'TOTAL ASISTENCIA': reportes.reduce((a, r) => a + (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0), 0),
    'CANT. CONVERTIDOS': sumField(reportes, 'cantConvertidos'),
    'CANT. NIÑOS CRISTIANOS': sumField(reportes, 'cantNinosCristianos'),
    'CANT. NIÑOS AMIGOS': sumField(reportes, 'cantNinosAmigos'),
    'TOTAL NIÑOS': reportes.reduce((a, r) => a + (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0), 0),
    'VISITA CONSOLIDACIÓN': sumField(reportes, 'cantVisitaConsolidacion'),
    'VISITA CASA DE PAZ': sumField(reportes, 'cantVisitaCasaDePaz'),
    'VISITA HOGAR': sumField(reportes, 'cantVisitaHogar'),
    'HR EN ORACIÓN': sumField(reportes, 'cantHrOracion'),
    'HR. MEP': sumField(reportes, 'cantHrMep'),
    'HR. DISCIPULADO': sumField(reportes, 'cantHrDiscipulado'),
    'RETIRO ESPIRITUAL': sumField(reportes, 'cantRetiroEspiritual'),
    'CULTO CENT.': sumField(reportes, 'cantCultoCentral'),
    'OFRENDA SÁBADO': reportes.reduce((a, r) => a + Number(r.ofrendaSabado || 0), 0),
    'OFRENDA NIÑOS': reportes.reduce((a, r) => a + Number(r.ofrendaNinos || 0), 0),
    'OFRENDA MIÉRCOLES': reportes.reduce((a, r) => a + Number(r.ofrendaMiercoles || 0), 0),
    'TOTAL OFRENDA': reportes.reduce((a, r) => a + Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0), 0),
  };

  const worksheet = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_aoa(worksheet, [[titulo]], { origin: 'A1' });
  XLSX.utils.sheet_add_json(worksheet, [...rows, total], { origin: 'A3' });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// ─────────────────────────────────────────────────────────
// Exportar consolidado por LÍDERES a PDF
// ─────────────────────────────────────────────────────────

export const exportConsolidadoPDF = (reportes, titulo = 'Consolidado Sectorial', fileName = 'Consolidado') => {
  if (!reportes || reportes.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });

  doc.setFontSize(14);
  doc.setTextColor(55, 48, 163);
  doc.text(titulo, 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);

  const headers = [
    'ÍTEM', 'LÍDERES',
    'HERMANOS', 'AMIGOS', 'ADOLESCENTES', 'TOTAL',
    'CONVERT.', 'NIÑOS CRIST.', 'NIÑOS AMIGOS', 'TOTAL',
    'VIS. CONSOL.', 'VIS. CASA PAZ', 'VIS. HOGAR',
    'HR ORACIÓN', 'HR MEP', 'HR DISCIP.', 'RETIRO', 'CULTO CENT.',
    'OFR. SÁB.', 'OFR. NIÑOS', 'OFR. MIÉRC.', 'TOTAL OFR.',
  ];

  const bodyRows = reportes.map((r, i) => [
    i + 1,
    r.liderNombre || `Líder ${r.liderId || ''}`,
    r.cantHermanos || 0, r.cantAmigos || 0, r.cantAdolescentes || 0,
    (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0),
    r.cantConvertidos || 0, r.cantNinosCristianos || 0, r.cantNinosAmigos || 0,
    (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0),
    r.cantVisitaConsolidacion || 0, r.cantVisitaCasaDePaz || 0, r.cantVisitaHogar || 0,
    r.cantHrOracion || 0, r.cantHrMep || 0, r.cantHrDiscipulado || 0, r.cantRetiroEspiritual || 0,
    r.cantCultoCentral || 0,
    Number(r.ofrendaSabado || 0).toFixed(0),
    Number(r.ofrendaNinos || 0).toFixed(0),
    Number(r.ofrendaMiercoles || 0).toFixed(0),
    (Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0)).toFixed(0),
  ]);

  const totalRow = [
    '', 'TOTAL',
    sumField(reportes, 'cantHermanos'), sumField(reportes, 'cantAmigos'), sumField(reportes, 'cantAdolescentes'),
    reportes.reduce((a, r) => a + (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0), 0),
    sumField(reportes, 'cantConvertidos'), sumField(reportes, 'cantNinosCristianos'), sumField(reportes, 'cantNinosAmigos'),
    reportes.reduce((a, r) => a + (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0), 0),
    sumField(reportes, 'cantVisitaConsolidacion'), sumField(reportes, 'cantVisitaCasaDePaz'), sumField(reportes, 'cantVisitaHogar'),
    sumField(reportes, 'cantHrOracion'), sumField(reportes, 'cantHrMep'), sumField(reportes, 'cantHrDiscipulado'), sumField(reportes, 'cantRetiroEspiritual'),
    sumField(reportes, 'cantCultoCentral'),
    reportes.reduce((a, r) => a + Number(r.ofrendaSabado || 0), 0).toFixed(0),
    reportes.reduce((a, r) => a + Number(r.ofrendaNinos || 0), 0).toFixed(0),
    reportes.reduce((a, r) => a + Number(r.ofrendaMiercoles || 0), 0).toFixed(0),
    reportes.reduce((a, r) => a + Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0), 0).toFixed(0),
  ];

  autoTable(doc, {
    startY: 26,
    head: [headers],
    body: [...bodyRows, totalRow],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [60, 60, 60], lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 8 },
    bodyStyles: { valign: 'middle' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data) => {
      if (data.row.index === bodyRows.length) {
        data.cell.styles.fillColor = [253, 224, 71];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      1: { cellWidth: 35, fontStyle: 'bold' },
    },
  });

  doc.save(`${fileName}.pdf`);
};

// ─────────────────────────────────────────────────────────
// Exportar consolidado por SECTORES a Excel (formato imagen)
// Cada fila = un sector con suma de todos sus grupos
// ─────────────────────────────────────────────────────────

/**
 * @param {Array} sectoresData - Array de objetos con { sectorNombre, reportes[] }
 * @param {string} titulo
 * @param {string} fileName
 */
export const exportConsolidadoSectoresExcel = (sectoresData, titulo = 'Consolidado por Sectores', fileName = 'ConsolidadoSectores') => {
  if (!sectoresData || sectoresData.length === 0) return;

  const rows = sectoresData.map((s, idx) => {
    const reps = s.reportes || [];
    const tA = reps.reduce((a, r) => a + (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0), 0);
    const tN = reps.reduce((a, r) => a + (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0), 0);
    const tO = reps.reduce((a, r) => a + Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0), 0);
    return {
      'ÍTEM': idx + 1,
      'SECTOR': s.sectorNombre,
      'HERMANOS': sumField(reps, 'cantHermanos'),
      'AMIGOS': sumField(reps, 'cantAmigos'),
      'ADOLESCENTES': sumField(reps, 'cantAdolescentes'),
      'TOTAL ASISTENCIA': tA,
      'CONVERTIDOS': sumField(reps, 'cantConvertidos'),
      'NIÑOS CRIST.': sumField(reps, 'cantNinosCristianos'),
      'NIÑOS AMIGOS': sumField(reps, 'cantNinosAmigos'),
      'TOTAL NIÑOS': tN,
      'VIS. CONSOL.': sumField(reps, 'cantVisitaConsolidacion'),
      'VIS. CASA PAZ': sumField(reps, 'cantVisitaCasaDePaz'),
      'VIS. HOGAR': sumField(reps, 'cantVisitaHogar'),
      'HR ORACIÓN': sumField(reps, 'cantHrOracion'),
      'HR MEP': sumField(reps, 'cantHrMep'),
      'HR DISCIP.': sumField(reps, 'cantHrDiscipulado'),
      'RETIRO': sumField(reps, 'cantRetiroEspiritual'),
      'CULTO CENT.': sumField(reps, 'cantCultoCentral'),
      'OFR. SÁBADO': reps.reduce((a, r) => a + Number(r.ofrendaSabado || 0), 0),
      'OFR. NIÑOS': reps.reduce((a, r) => a + Number(r.ofrendaNinos || 0), 0),
      'OFR. MIÉRC.': reps.reduce((a, r) => a + Number(r.ofrendaMiercoles || 0), 0),
      'TOTAL OFRENDA': tO,
    };
  });

  // Fila TOTAL
  const totalRow = {
    'ÍTEM': '', 'SECTOR': 'TOTAL',
    'HERMANOS': rows.reduce((a, r) => a + r['HERMANOS'], 0),
    'AMIGOS': rows.reduce((a, r) => a + r['AMIGOS'], 0),
    'ADOLESCENTES': rows.reduce((a, r) => a + r['ADOLESCENTES'], 0),
    'TOTAL ASISTENCIA': rows.reduce((a, r) => a + r['TOTAL ASISTENCIA'], 0),
    'CONVERTIDOS': rows.reduce((a, r) => a + r['CONVERTIDOS'], 0),
    'NIÑOS CRIST.': rows.reduce((a, r) => a + r['NIÑOS CRIST.'], 0),
    'NIÑOS AMIGOS': rows.reduce((a, r) => a + r['NIÑOS AMIGOS'], 0),
    'TOTAL NIÑOS': rows.reduce((a, r) => a + r['TOTAL NIÑOS'], 0),
    'VIS. CONSOL.': rows.reduce((a, r) => a + r['VIS. CONSOL.'], 0),
    'VIS. CASA PAZ': rows.reduce((a, r) => a + r['VIS. CASA PAZ'], 0),
    'VIS. HOGAR': rows.reduce((a, r) => a + r['VIS. HOGAR'], 0),
    'HR ORACIÓN': rows.reduce((a, r) => a + r['HR ORACIÓN'], 0),
    'HR MEP': rows.reduce((a, r) => a + r['HR MEP'], 0),
    'HR DISCIP.': rows.reduce((a, r) => a + r['HR DISCIP.'], 0),
    'RETIRO': rows.reduce((a, r) => a + r['RETIRO'], 0),
    'CULTO CENT.': rows.reduce((a, r) => a + r['CULTO CENT.'], 0),
    'OFR. SÁBADO': rows.reduce((a, r) => a + r['OFR. SÁBADO'], 0),
    'OFR. NIÑOS': rows.reduce((a, r) => a + r['OFR. NIÑOS'], 0),
    'OFR. MIÉRC.': rows.reduce((a, r) => a + r['OFR. MIÉRC.'], 0),
    'TOTAL OFRENDA': rows.reduce((a, r) => a + r['TOTAL OFRENDA'], 0),
  };

  const worksheet = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_aoa(worksheet, [[titulo]], { origin: 'A1' });
  XLSX.utils.sheet_add_json(worksheet, [...rows, totalRow], { origin: 'A3' });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado Sectores');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// ─────────────────────────────────────────────────────────
// Exportar consolidado por SECTORES a PDF
// ─────────────────────────────────────────────────────────

export const exportConsolidadoSectoresPDF = (sectoresData, titulo = 'Consolidado por Sectores', fileName = 'ConsolidadoSectores') => {
  if (!sectoresData || sectoresData.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });

  doc.setFontSize(14);
  doc.setTextColor(55, 48, 163);
  doc.text(titulo, 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);

  const headers = [
    'ÍTEM', 'SECTOR',
    'HERMANOS', 'AMIGOS', 'ADOLESC.', 'TOTAL',
    'CONVERT.', 'NIÑOS CRIST.', 'NIÑOS AMIGOS', 'TOTAL NIÑOS',
    'VIS.CONSOL.', 'VIS.CASA PAZ', 'VIS.HOGAR',
    'HR ORACIÓN', 'HR MEP', 'HR DISCIP.', 'RETIRO', 'CULTO CENT.',
    'OFR.SÁB.', 'OFR.NIÑOS', 'OFR.MIÉRC.', 'TOTAL OFR.',
  ];

  const bodyRows = sectoresData.map((s, i) => {
    const reps = s.reportes || [];
    const tA = reps.reduce((a, r) => a + (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0), 0);
    const tN = reps.reduce((a, r) => a + (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0), 0);
    const tO = reps.reduce((a, r) => a + Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0), 0);
    return [
      i + 1, s.sectorNombre,
      sumField(reps, 'cantHermanos'), sumField(reps, 'cantAmigos'), sumField(reps, 'cantAdolescentes'), tA,
      sumField(reps, 'cantConvertidos'), sumField(reps, 'cantNinosCristianos'), sumField(reps, 'cantNinosAmigos'), tN,
      sumField(reps, 'cantVisitaConsolidacion'), sumField(reps, 'cantVisitaCasaDePaz'), sumField(reps, 'cantVisitaHogar'),
      sumField(reps, 'cantHrOracion'), sumField(reps, 'cantHrMep'), sumField(reps, 'cantHrDiscipulado'), sumField(reps, 'cantRetiroEspiritual'),
      sumField(reps, 'cantCultoCentral'),
      reps.reduce((a, r) => a + Number(r.ofrendaSabado || 0), 0).toFixed(0),
      reps.reduce((a, r) => a + Number(r.ofrendaNinos || 0), 0).toFixed(0),
      reps.reduce((a, r) => a + Number(r.ofrendaMiercoles || 0), 0).toFixed(0),
      tO.toFixed(0),
    ];
  });

  // Fila TOTAL
  const sums = (field) => sectoresData.reduce((a, s) => a + sumField(s.reportes || [], field), 0);
  const totalRow = [
    '', 'TOTAL',
    sums('cantHermanos'), sums('cantAmigos'), sums('cantAdolescentes'),
    sectoresData.reduce((a, s) => a + (s.reportes || []).reduce((b, r) => b + (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0), 0), 0),
    sums('cantConvertidos'), sums('cantNinosCristianos'), sums('cantNinosAmigos'),
    sectoresData.reduce((a, s) => a + (s.reportes || []).reduce((b, r) => b + (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0), 0), 0),
    sums('cantVisitaConsolidacion'), sums('cantVisitaCasaDePaz'), sums('cantVisitaHogar'),
    sums('cantHrOracion'), sums('cantHrMep'), sums('cantHrDiscipulado'), sums('cantRetiroEspiritual'),
    sums('cantCultoCentral'),
    sectoresData.reduce((a, s) => a + (s.reportes || []).reduce((b, r) => b + Number(r.ofrendaSabado || 0), 0), 0).toFixed(0),
    sectoresData.reduce((a, s) => a + (s.reportes || []).reduce((b, r) => b + Number(r.ofrendaNinos || 0), 0), 0).toFixed(0),
    sectoresData.reduce((a, s) => a + (s.reportes || []).reduce((b, r) => b + Number(r.ofrendaMiercoles || 0), 0), 0).toFixed(0),
    sectoresData.reduce((a, s) => a + (s.reportes || []).reduce((b, r) => b + Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0), 0), 0).toFixed(0),
  ];

  autoTable(doc, {
    startY: 26,
    head: [headers],
    body: [...bodyRows, totalRow],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica', textColor: [60, 60, 60], lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 7.5 },
    bodyStyles: { valign: 'middle', halign: 'center' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data) => {
      if (data.row.index === bodyRows.length) {
        data.cell.styles.fillColor = [253, 224, 71];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9, fontStyle: 'bold' },
      1: { cellWidth: 32, fontStyle: 'bold', halign: 'left' },
    },
  });

  doc.save(`${fileName}.pdf`);
};

// ─────────────────────────────────────────────────────────
// Funciones legacy
// ─────────────────────────────────────────────────────────

export const exportToExcel = (reportes, fileName = 'Reportes') => {
  if (!reportes || reportes.length === 0) return;
  const data = reportes.map((r, i) => mapReporteRow(r, i));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (reportes, title = 'Reporte Consolidado', fileName = 'Reportes') => {
  exportConsolidadoPDF(reportes, title, fileName);
};

// ─────────────────────────────────────────────────────────
// Exportar un REPORTE SECTORIAL a PDF con firma e información detallada
// ─────────────────────────────────────────────────────────
export const exportReporteSectorialPDF = (reporte) => {
  if (!reporte) return;

  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  const w = doc.internal.pageSize.width;
  const h = doc.internal.pageSize.height;

  // Título e info general
  doc.setFontSize(15);
  doc.setTextColor(30, 27, 75); // Indigo oscuro
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE SEMANAL DE SUPERVISOR SECTORIAL', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sector: ${reporte.sectorNombre || '—'}`, 14, 26);
  doc.text(`Supervisor: ${reporte.supervisorNombre || '—'}`, 14, 31);
  doc.text(`Período: ${reporte.semanaDesde} hasta ${reporte.semanaHasta}`, 14, 36);
  doc.text(`Estado del Reporte: ${reporte.estado}`, 14, 41);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, w - 70, 26);

  // 1. VIDA DEVOCIONAL
  const fmtSiNo = (v) => v ? 'SÍ' : 'NO';
  const headersDevocional = ['Oración Diaria', 'Lectura Bíblica', '¿Hizo Ayuno?', 'Culto de Liderazgo', 'Diezmo Mensual'];
  const dataDevocional = [[
    `${reporte.horasOracion || 0} Hr ${reporte.minutosOracion || 0} Mn`,
    fmtSiNo(reporte.lecturaBiblia),
    fmtSiNo(reporte.ayuno),
    fmtSiNo(reporte.cultoLiderazgo),
    fmtSiNo(reporte.diezmo)
  ]];

  autoTable(doc, {
    startY: 46,
    head: [headersDevocional],
    body: dataDevocional,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    bodyStyles: { halign: 'center', fontSize: 9 },
    margin: { left: 14, right: 14 }
  });

  let currentY = doc.lastAutoTable.finalY + 8;

  // 2. ATENCIÓN PERSONALIZADA
  const atenciones = reporte.atencionesJson ? JSON.parse(reporte.atencionesJson) : [];
  doc.setFontSize(11);
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.text('ATENCIÓN PERSONALIZADA', 14, currentY);
  currentY += 4;

  if (atenciones.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'italic');
    doc.text('No se registraron atenciones en este período.', 14, currentY);
    currentY += 8;
  } else {
    const headersAtenciones = ['Ítem', 'Líder / Miembro', 'Lugar', 'Fecha', 'Hora', 'Motivo', 'Resultado'];
    const bodyAtenciones = atenciones.map((a, i) => [
      i + 1,
      a.lider || '—',
      a.lugar || '—',
      a.fecha || '—',
      a.hora || '—',
      a.motivo || '—',
      a.resultado || '—'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [headersAtenciones],
      body: bodyAtenciones,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 40 },
        6: { cellWidth: 40 }
      },
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 3. REUNIÓN DE PLANIFICACIÓN
  if (currentY + 40 > h) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPERVISANDO LA REUNIÓN DE PLANIFICACIÓN', 14, currentY);
  currentY += 4;

  const dataPlanificacion = [
    ['Grupo Visitado', reporte.planificacionGrupo || '—'],
    ['Fecha de Visita', reporte.planificacionFecha || '—'],
    ['Hora de Llegada', reporte.planificacionHora || '—'],
    ['Aspectos Positivos', reporte.planificacionPositivos || '—'],
    ['Aspectos Débiles', reporte.planificacionNegativos || '—']
  ];

  autoTable(doc, {
    startY: currentY,
    body: dataPlanificacion,
    theme: 'grid',
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 50 },
      1: { cellWidth: 132 }
    },
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 8;

  // 4. SUPERVISIÓN DE REUNIÓN EVANGELÍSTICA
  if (currentY + 30 > h) {
    doc.addPage();
    currentY = 20;
  }

  const supervisiones = reporte.supervisionesJson ? JSON.parse(reporte.supervisionesJson) : [];
  doc.setFontSize(11);
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPERVISANDO LA REUNIÓN EVANGELÍSTICA', 14, currentY);
  currentY += 4;

  if (supervisiones.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'italic');
    doc.text('No se registraron supervisiones de reunión evangelística.', 14, currentY);
    currentY += 8;
  } else {
    const headersSupervisiones = ['Ítem', 'Grupo', 'Fecha', 'Hora', 'Aspectos Positivos', 'Aspectos Débiles'];
    const bodySupervisiones = supervisiones.map((s, i) => [
      i + 1,
      s.grupoNombre || '—',
      s.fecha || '—',
      s.hora || '—',
      s.positivos || '—',
      s.negativos || '—'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [headersSupervisiones],
      body: bodySupervisiones,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 48 },
        5: { cellWidth: 49 }
      },
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 5. EVALUACIÓN DE TRABAJO EN EQUIPO
  if (currentY + 30 > h) {
    doc.addPage();
    currentY = 20;
  }

  const evaluaciones = reporte.evaluacionesEquipoJson ? JSON.parse(reporte.evaluacionesEquipoJson) : [];
  doc.setFontSize(11);
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN DE TRABAJO EN EQUIPO', 14, currentY);
  currentY += 4;

  if (evaluaciones.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'italic');
    doc.text('No hay comentarios de evaluación registrados.', 14, currentY);
    currentY += 8;
  } else {
    const headersEvals = ['Grupo Familiar', 'Fortalezas / Debilidades / Comentarios'];
    const bodyEvals = evaluaciones.map((e) => [
      e.grupoNombre || '—',
      e.evaluacion || 'Sin comentarios registrados.'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [headersEvals],
      body: bodyEvals,
      theme: 'grid',
      headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 137 }
      },
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 6. FIRMA MANUSCRITA
  if (reporte.firma) {
    if (currentY + 50 > h) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMA DEL SUPERVISOR SECTORIAL:', 14, currentY + 5);

    try {
      doc.addImage(reporte.firma, 'PNG', 14, currentY + 8, 60, 22);
      currentY += 35;
    } catch (err) {
      console.error("Error al renderizar firma en PDF:", err);
      doc.text('[Error al renderizar la firma manuscrita]', 14, currentY + 12);
      currentY += 20;
    }
  }

  // Descargar el documento PDF
  const nombreArchivo = `Reporte_Sectorial_${reporte.sectorNombre?.replace(/\s+/g, '_') || 'Sector'}_${reporte.semanaDesde}.pdf`;
  doc.save(nombreArchivo);
};

