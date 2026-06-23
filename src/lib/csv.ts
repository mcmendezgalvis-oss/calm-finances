/**
 * Build a CSV string with RFC 4180 escaping (commas, quotes, newlines).
 * Prepends a UTF-8 BOM so Excel opens it with the right encoding.
 */
export function toCSV(rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  return "\uFEFF" + body;
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}