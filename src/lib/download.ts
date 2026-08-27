export function downloadBlob(
  filename: string,
  content: string,
  mime = 'text/plain',
) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) {
    downloadBlob(filename, '', 'text/csv')
    return
  }
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ]
  downloadBlob(filename, lines.join('\n'), 'text/csv')
}