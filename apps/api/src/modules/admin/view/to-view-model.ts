import type { AdminPageData, AdminPageViewModel } from '../types'
import { formatRelativeAge } from './format-relative-age'

export function toViewModel(data: AdminPageData, styles: string): AdminPageViewModel {
  const { stats, workerStatus, allUsers, allTrackers, recentPrices, recentNotifs } = data

  return {
    styles,
    now: new Date().toLocaleString(),
    stats,
    workerStatus: {
      lastRunText: workerStatus.lastRun
        ? `${new Date(workerStatus.lastRun).toLocaleString()} (${formatRelativeAge(workerStatus.ageMs)})`
        : 'never',
      freshness: workerStatus.freshness,
      forcePending: workerStatus.forcePending,
    },
    allUsers: allUsers.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username ? `@${u.username}` : '-',
      fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '-',
      trackerCount: Number(u.trackerCount ?? 0),
      activeTrackerCount: Number(u.activeTrackerCount ?? 0),
      joinedDate: new Date(u.createdAt).toLocaleDateString(),
      canBan: Number(u.activeTrackerCount ?? 0) > 0,
      canUnban: Number(u.trackerCount ?? 0) > 0 && Number(u.activeTrackerCount ?? 0) === 0,
    })),
    allTrackers: allTrackers.map((t) => ({
      id: t.id,
      userLabel: t.username ? `@${t.username}` : (t.telegramId ?? '-'),
      route: `${t.origin.trim()} -> ${t.destination.trim()}`,
      departureDate: t.departureDate,
      thresholdText: `${Number(t.priceThreshold).toFixed(0)} ${t.currency.trim()}`,
      latestPriceText: t.latestPrice
        ? `${Number(t.latestPrice).toFixed(0)} ${t.currency.trim()}`
        : '-',
      isActive: t.isActive,
    })),
    recentPrices: recentPrices.map((p) => ({
      trackerId: p.trackerId,
      route: `${p.origin?.trim() ?? '?'} -> ${p.destination?.trim() ?? '?'}`,
      priceText: `${p.price} ${p.currency.trim()}`,
      source: p.source,
      fetchedAt: new Date(p.fetchedAt).toLocaleString(),
    })),
    recentNotifs: recentNotifs.map((n) => ({
      userLabel: n.username ? `@${n.username}` : (n.telegramId ?? '-'),
      route: `${n.origin?.trim() ?? '?'} -> ${n.destination?.trim() ?? '?'}`,
      priceText: `${n.price} ${n.currency.trim()}`,
      isSent: Boolean(n.sentAt),
      createdAt: new Date(n.createdAt).toLocaleString(),
    })),
  }
}
