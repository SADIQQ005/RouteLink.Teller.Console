export function formatCurrency(
  amount: number,
  currency = 'NGN',
  compact = false,
): string {
  const symbol = currency === 'USD' ? '$' : '₦'
  const value = compact
    ? new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)
    : new Intl.NumberFormat('en-NG').format(amount)
  return `${symbol}${value}`
}

export function formatDate(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function timeAgo(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}