const STORAGE_KEY = 'learndash_generated_reports_v1';
const MAX_ITEMS = 100;

/**
 * @typedef {Object} GeneratedReportRecord
 * @property {string} id
 * @property {string} createdAt ISO timestamp
 * @property {'attendance'|'performance'} kind
 * @property {string} title Human-readable title
 * @property {string} [courseId]
 * @property {string} [courseName]
 * @property {string} [userId]
 * @property {string} [userName]
 * @property {{ start?: string, end?: string }} [period]
 * @property {{ totalRecords?: number, averageScore?: number } | undefined} [summary]
 * @property {object} [snapshot] Enriched API payload (report, period, summary) for reopening on Reports → View
 */

export function getGeneratedReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {string} id */
export function getGeneratedReportById(id) {
  if (!id) return null;
  return getGeneratedReports().find((r) => r.id === id) ?? null;
}

/**
 * @param {Omit<GeneratedReportRecord, 'id'|'createdAt'>} entry
 * @returns {GeneratedReportRecord}
 */
export function appendGeneratedReport(entry) {
  const list = getGeneratedReports();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const next = [record, ...list].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Could not persist report history', e);
  }
  try {
    window.dispatchEvent(new CustomEvent('learndash:reports-updated', { detail: record }));
  } catch {
    /* ignore */
  }
  return record;
}

export function removeGeneratedReport(id) {
  const list = getGeneratedReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('learndash:reports-updated'));
}

export function clearGeneratedReports() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('learndash:reports-updated'));
}
