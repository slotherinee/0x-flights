import type { AdminPageData, AdminPageViewModel } from '../types'
import { formatRelativeAge } from './format-relative-age'

const MOSCOW_TZ = 'Europe/Moscow'

function formatMoscowDateTime(value: Date | string | number): string {
  return new Date(value).toLocaleString('ru-RU', { timeZone: MOSCOW_TZ })
}

function formatMoscowDate(value: Date | string | number): string {
  return new Date(value).toLocaleDateString('ru-RU', { timeZone: MOSCOW_TZ })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function hrefFor(
  tab: 'users' | 'trackers' | 'prices' | 'notifications',
  usersPage: number,
  trackersPage: number,
  pricesPage: number,
  notificationsPage: number,
): string {
  const sp = new URLSearchParams()
  sp.set('tab', tab)
  sp.set('usersPage', String(usersPage))
  sp.set('trackersPage', String(trackersPage))
  sp.set('pricesPage', String(pricesPage))
  sp.set('notificationsPage', String(notificationsPage))
  return `/adminpage?${sp.toString()}`
}

export function toViewModel(
  data: AdminPageData,
  styles: string,
  activeTab: 'overview' | 'users' | 'trackers' | 'prices' | 'notifications',
): AdminPageViewModel {
  const { stats, workerStatus, usersPage, trackersPage, pricesPage, notificationsPage } = data

  const uPage = clamp(usersPage.meta.page, 1, usersPage.meta.totalPages)
  const tPage = clamp(trackersPage.meta.page, 1, trackersPage.meta.totalPages)
  const pPage = clamp(pricesPage.meta.page, 1, pricesPage.meta.totalPages)
  const nPage = clamp(notificationsPage.meta.page, 1, notificationsPage.meta.totalPages)

  return {
    styles,
    now: formatMoscowDateTime(new Date()),
    activeTab,
    stats,
    workerStatus: {
      lastRunText: workerStatus.lastRun
        ? `${formatMoscowDateTime(workerStatus.lastRun)} (${formatRelativeAge(workerStatus.ageMs)})`
        : 'never',
      freshness: workerStatus.freshness,
      forcePending: workerStatus.forcePending,
    },
    allUsers: usersPage.items.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username ? `@${u.username}` : '-',
      fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '-',
      trackerCount: Number(u.trackerCount ?? 0),
      activeTrackerCount: Number(u.activeTrackerCount ?? 0),
      joinedDate: formatMoscowDate(u.createdAt),
      canBan: Number(u.activeTrackerCount ?? 0) > 0,
      canUnban: Number(u.trackerCount ?? 0) > 0 && Number(u.activeTrackerCount ?? 0) === 0,
    })),
    allTrackers: trackersPage.items.map((t) => ({
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
    recentPrices: pricesPage.items.map((p) => ({
      trackerId: p.trackerId,
      route: `${p.origin?.trim() ?? '?'} -> ${p.destination?.trim() ?? '?'}`,
      priceText: `${p.price} ${p.currency.trim()}`,
      source: p.source,
      fetchedAt: formatMoscowDateTime(p.fetchedAt),
    })),
    recentNotifs: notificationsPage.items.map((n) => ({
      userLabel: n.username ? `@${n.username}` : (n.telegramId ?? '-'),
      route: `${n.origin?.trim() ?? '?'} -> ${n.destination?.trim() ?? '?'}`,
      priceText: `${n.price} ${n.currency.trim()}`,
      isSent: Boolean(n.sentAt),
      createdAt: formatMoscowDateTime(n.createdAt),
    })),
    usersPagination: usersPage.meta,
    trackersPagination: trackersPage.meta,
    pricesPagination: pricesPage.meta,
    notificationsPagination: notificationsPage.meta,
    usersPrevHref: hrefFor('users', clamp(uPage - 1, 1, usersPage.meta.totalPages), tPage, pPage, nPage),
    usersNextHref: hrefFor('users', clamp(uPage + 1, 1, usersPage.meta.totalPages), tPage, pPage, nPage),
    trackersPrevHref: hrefFor('trackers', uPage, clamp(tPage - 1, 1, trackersPage.meta.totalPages), pPage, nPage),
    trackersNextHref: hrefFor('trackers', uPage, clamp(tPage + 1, 1, trackersPage.meta.totalPages), pPage, nPage),
    pricesPrevHref: hrefFor('prices', uPage, tPage, clamp(pPage - 1, 1, pricesPage.meta.totalPages), nPage),
    pricesNextHref: hrefFor('prices', uPage, tPage, clamp(pPage + 1, 1, pricesPage.meta.totalPages), nPage),
    notificationsPrevHref: hrefFor('notifications', uPage, tPage, pPage, clamp(nPage - 1, 1, notificationsPage.meta.totalPages)),
    notificationsNextHref: hrefFor('notifications', uPage, tPage, pPage, clamp(nPage + 1, 1, notificationsPage.meta.totalPages)),
  }
}
