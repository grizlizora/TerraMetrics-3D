import type { CountryProperties, AggregatedContinentStats } from '../types';

/**
 * Downloads a string or Blob as a file with the specified filename and MIME type.
 */
export function downloadBlob(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports full country or continent properties as structured JSON.
 */
export function exportToJSON(
  entity: CountryProperties | AggregatedContinentStats | null,
  isCountry: boolean,
  name: string
) {
  if (!entity) return;
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `TerraMetrics_${sanitizedName}_${timestamp}.json`;

  const payload = {
    source: 'TerraMetrics-3D Analytics Engine',
    exportedAt: new Date().toISOString(),
    entityType: isCountry ? 'Country' : 'Continent/World',
    name,
    data: entity,
  };

  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json;charset=utf-8;');
}

/**
 * Exports metrics as a clean, Excel-compatible UTF-8 CSV table.
 */
export function exportToCSV(
  rows: Array<{ category: string; metric: string; value: string | number }>,
  name: string
) {
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `TerraMetrics_${sanitizedName}_${timestamp}.csv`;

  // UTF-8 BOM for perfect Excel/Numbers compatibility
  let csv = '\uFEFF"Category","Metric","Value"\n';

  rows.forEach((r) => {
    const cat = `"${String(r.category).replace(/"/g, '""')}"`;
    const met = `"${String(r.metric).replace(/"/g, '""')}"`;
    const val = `"${String(r.value).replace(/"/g, '""')}"`;
    csv += `${cat},${met},${val}\n`;
  });

  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Captures the Map WebGL canvas and triggers a PNG download.
 */
export function exportMapToPNG(mapCanvas: HTMLCanvasElement | null, name: string) {
  if (!mapCanvas) return;
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `TerraMetrics_Map_${sanitizedName}_${timestamp}.png`;

  try {
    mapCanvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, filename, 'image/png');
      }
    }, 'image/png');
  } catch (err) {
    console.warn('[exportUtils] Map canvas export error:', err);
  }
}
