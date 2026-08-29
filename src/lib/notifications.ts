export type NotificationKind = 'pending' | 'approved'

export interface NotificationRecord {
  id: string
  kind: NotificationKind
  reference: string
  beneficiary: string
  createdAt: number
}

const STORAGE_KEY = 'routelink.teller.notifications'

export const NOTIFICATION_TTL_MS = 3 * 24 * 60 * 60 * 1000

function readAll(): NotificationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(items: NotificationRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function loadNotifications(): NotificationRecord[] {
  const now = Date.now()
  const stored = readAll()
  const fresh = stored.filter((n) => now - n.createdAt < NOTIFICATION_TTL_MS)
  if (fresh.length !== stored.length) persist(fresh)
  return fresh
}

export function addNotification(
  input: Omit<NotificationRecord, 'id' | 'createdAt'>,
): void {
  const item: NotificationRecord = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  }
  persist([item, ...loadNotifications()])
  playNotificationSound()
}

let audioContext: AudioContext | null = null

function ensureAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return null
      audioContext = new Ctor()
    }
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  } catch {
    return null
  }
}

export function playNotificationSound(): void {
  try {
    const ctx = ensureAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [
      { freq: 880, start: 0, duration: 0.18 },
      { freq: 1318.5, start: 0.22, duration: 0.3 },
    ]
    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0.0001, now + note.start)
      gain.gain.exponentialRampToValueAtTime(
        0.25,
        now + note.start + 0.02,
      )
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + note.start + note.duration,
      )
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + note.start)
      osc.stop(now + note.start + note.duration)
    }
  } catch {
    /* ignore audio failures */
  }
}

export function formatNotificationTime(createdAt: number): string {
  const diff = Date.now() - createdAt
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}