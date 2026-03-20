import { Elysia } from 'elysia'
import { env } from '@0x-flights/config'
import { getRedisConfig } from '@0x-flights/config'
import { getDb } from '@0x-flights/db'
import { users, trackers, prices, notifications } from '@0x-flights/db'
import { eq, desc, count, sql } from 'drizzle-orm'
import { Redis } from 'ioredis'

const redis = new Redis({
  ...getRedisConfig(),
  lazyConnect: true,
  maxRetriesPerRequest: 1,
})

redis.on('error', (err) => {
  console.error('[admin redis] error:', err.message)
})

// ─── Basic Auth ───────────────────────────────────────────────────────────────
function checkAuth(h: string | undefined): boolean {
  if (!h?.startsWith('Basic ')) return false
  const [user, ...rest] = atob(h.slice(6)).split(':')
  return user === env.ADMIN_USER && rest.join(':') === env.ADMIN_PASSWORD
}

const unauth = () =>
  new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="0x-flights admin"' },
  })

// ─── Data fetchers ────────────────────────────────────────────────────────────
async function getStats() {
  const db = getDb()
  const [[u], [t], [p], [n]] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(trackers).where(eq(trackers.isActive, true)),
    db.select({ count: count() }).from(prices),
    db.select({ count: count() }).from(notifications),
  ])
  return {
    users: u?.count ?? 0,
    activeTrackers: t?.count ?? 0,
    priceChecks: p?.count ?? 0,
    notifications: n?.count ?? 0,
  }
}

async function getAllUsers() {
  const db = getDb()
  return db
    .select({
      id: users.id,
      telegramId: users.telegramId,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      trackerCount: sql<number>`cast(count(${trackers.id}) as int)`,
      activeTrackerCount: sql<number>`cast(sum(case when ${trackers.isActive} then 1 else 0 end) as int)`,
    })
    .from(users)
    .leftJoin(trackers, eq(trackers.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(200)
}

async function getAllTrackers() {
  const db = getDb()
  return db
    .select({
      id: trackers.id,
      userId: trackers.userId,
      telegramId: users.telegramId,
      username: users.username,
      origin: trackers.origin,
      destination: trackers.destination,
      departureDate: trackers.departureDate,
      priceThreshold: trackers.priceThreshold,
      currency: trackers.currency,
      isActive: trackers.isActive,
      createdAt: trackers.createdAt,
      latestPrice: sql<string | null>`(
        SELECT p.price::text FROM prices p
        WHERE p.tracker_id = ${trackers.id}
        ORDER BY p.fetched_at DESC LIMIT 1
      )`,
    })
    .from(trackers)
    .leftJoin(users, eq(trackers.userId, users.id))
    .orderBy(desc(trackers.createdAt))
    .limit(100)
}

async function getRecentPrices() {
  const db = getDb()
  return db
    .select({
      trackerId: prices.trackerId,
      origin: trackers.origin,
      destination: trackers.destination,
      price: prices.price,
      currency: prices.currency,
      source: prices.source,
      fetchedAt: prices.fetchedAt,
    })
    .from(prices)
    .leftJoin(trackers, eq(prices.trackerId, trackers.id))
    .orderBy(desc(prices.fetchedAt))
    .limit(30)
}

async function getRecentNotifications() {
  const db = getDb()
  return db
    .select({
      id: notifications.id,
      telegramId: users.telegramId,
      username: users.username,
      origin: trackers.origin,
      destination: trackers.destination,
      price: notifications.price,
      currency: notifications.currency,
      sentAt: notifications.sentAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.userId, users.id))
    .leftJoin(trackers, eq(notifications.trackerId, trackers.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30)
}

async function getPriceWorkerStatus() {
  const [lastRun, forceFlag] = await redis.mget('worker-prices:last-run', 'worker-prices:force-run')
  let ageMs: number | null = null
  let freshness: 'ok' | 'stale' | 'never' = 'never'

  if (lastRun) {
    const parsed = new Date(lastRun).getTime()
    if (!Number.isNaN(parsed)) {
      ageMs = Date.now() - parsed
      const staleAfterMs = Math.max(env.PRICE_WORKER_INTERVAL_MS * 2, 60_000)
      freshness = ageMs <= staleAfterMs ? 'ok' : 'stale'
    }
  }

  return {
    lastRun,
    ageMs,
    freshness,
    forcePending: forceFlag != null,
  }
}

function formatRelativeAge(ageMs: number | null): string {
  if (ageMs == null) return 'never'
  if (ageMs < 60_000) return 'just now'

  const totalMinutes = Math.floor(ageMs / 60_000)
  if (totalMinutes < 60) return `${totalMinutes} min ago`

  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) return `${totalHours} h ago`

  const totalDays = Math.floor(totalHours / 24)
  return `${totalDays} d ago`
}

// ─── CSS (shared) ─────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'SF Mono', 'Fira Code', monospace; background: #111317; color: #fafafa; padding: 32px }
  h1 { font-size: 1.1rem; color: #fafafa; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase }
  h2 { font-size: 0.78rem; color: #d8d8d8; margin: 36px 0 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #323842; padding-bottom: 8px }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px }
  .stat { background: #171b22; border: 1px solid #2d3440; border-radius: 6px; padding: 16px }
  .stat-label { font-size: 0.68rem; color: #c8c8c8; margin-bottom: 6px; text-transform: uppercase }
  .stat-value { font-size: 1.8rem; color: #fafafa; font-weight: 700 }
  table { width: 100%; border-collapse: collapse; font-size: 0.78rem }
  th { text-align: left; color: #d7d7d7; padding: 8px 10px; border-bottom: 1px solid #323842; font-weight: 500 }
  td { padding: 7px 10px; border-bottom: 1px solid #242b35; color: #fafafa; white-space: nowrap }
  tr.inactive td { opacity: 0.35 }
  tr:hover td { background: #1a202a }
  .badge { padding: 2px 7px; border-radius: 3px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px }
  .badge.active { background: #163324; color: #83f1b3 }
  .badge.off    { background: #3b1a1a; color: #ff9d9d }
  .btn { border: none; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 0.72rem; font-family: inherit }
  .btn-red  { background: #3a1c1c; color: #ffd1d1; border: 1px solid #6a2d2d }
  .btn-red:hover { background: #4a2323 }
  .btn-blue { background: #1d2a44; color: #cfe2ff; border: 1px solid #34518c }
  .btn-blue:hover { background: #26375a }
  .footer { font-size: 0.68rem; color: #c2c2c2; margin-top: 40px }
  a { color: #e5e5e5; text-decoration: none } a:hover { color: #ffffff }
  .dim { color: #c2c2c2 }
  .price-tag { color: #facc15 }
  .nav { display: flex; gap: 20px; margin-bottom: 32px; font-size: 0.75rem }
  .nav a { color: #d5d5d5; padding: 4px 0; border-bottom: 1px solid transparent }
  .nav a:hover { color: #fff; border-bottom-color: #8b99ab }
`

// ─── HTML builder ─────────────────────────────────────────────────────────────
function buildHtml(
  stats: Awaited<ReturnType<typeof getStats>>,
  workerStatus: Awaited<ReturnType<typeof getPriceWorkerStatus>>,
  allUsers: Awaited<ReturnType<typeof getAllUsers>>,
  allTrackers: Awaited<ReturnType<typeof getAllTrackers>>,
  recentPrices: Awaited<ReturnType<typeof getRecentPrices>>,
  recentNotifs: Awaited<ReturnType<typeof getRecentNotifications>>,
) {
  const userRows = allUsers.map((u) => `
    <tr>
      <td>#${u.id}</td>
      <td>${u.telegramId}</td>
      <td>${u.username ? '@' + u.username : '<span class="dim">—</span>'}</td>
      <td>${u.firstName ?? ''} ${u.lastName ?? ''}</td>
      <td>${u.trackerCount ?? 0} / <span style="color:#4ade80">${u.activeTrackerCount ?? 0}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        ${(u.activeTrackerCount ?? 0) > 0
          ? `<form method="POST" action="/adminpage/users/${u.id}/ban" style="display:inline">
               <button class="btn btn-red" onclick="return confirm('Ban user #${u.id} — deactivate all their trackers?')">Ban</button>
             </form>`
          : '<span class="dim">—</span>'}
      </td>
    </tr>`).join('')

  const trackerRows = allTrackers.map((t) => {
    const latest = t.latestPrice
      ? `<span class="price-tag">${Number(t.latestPrice).toFixed(0)} ${t.currency?.trim()}</span>`
      : '<span class="dim">—</span>'
    return `
    <tr class="${t.isActive ? '' : 'inactive'}">
      <td>#${t.id}</td>
      <td>${t.username ? '@' + t.username : t.telegramId ?? '—'}</td>
      <td><b>${t.origin?.trim()}→${t.destination?.trim()}</b></td>
      <td>${t.departureDate}</td>
      <td>${Number(t.priceThreshold).toFixed(0)} ${t.currency?.trim()}</td>
      <td>${latest}</td>
      <td><span class="badge ${t.isActive ? 'active' : 'off'}">${t.isActive ? 'active' : 'off'}</span></td>
      <td>${t.isActive
        ? `<form method="POST" action="/adminpage/trackers/${t.id}/deactivate" style="display:inline">
             <button class="btn btn-red" onclick="return confirm('Deactivate #${t.id}?')">Off</button>
           </form>`
        : '<span class="dim">—</span>'}</td>
    </tr>`}).join('')

  const priceRows = recentPrices.map((p) => `
    <tr>
      <td>#${p.trackerId}</td>
      <td>${p.origin?.trim()}→${p.destination?.trim()}</td>
      <td class="price-tag">${p.price} ${p.currency?.trim()}</td>
      <td>${p.source}</td>
      <td>${new Date(p.fetchedAt).toLocaleString()}</td>
    </tr>`).join('')

  const notifRows = recentNotifs.map((n) => `
    <tr>
      <td>${n.username ? '@' + n.username : n.telegramId ?? '—'}</td>
      <td>${n.origin?.trim() ?? '?'}→${n.destination?.trim() ?? '?'}</td>
      <td class="price-tag">${n.price} ${n.currency?.trim()}</td>
      <td>${n.sentAt
        ? `<span class="badge active">sent</span>`
        : `<span class="badge off">pending</span>`}</td>
      <td>${new Date(n.createdAt).toLocaleString()}</td>
    </tr>`).join('')

  const empty = (cols: number) =>
    `<tr><td colspan="${cols}" style="color:#333;padding:16px;text-align:center">no data</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>0x-flights · admin</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>✈ 0x-flights · admin</h1>

  <div class="stats">
    <div class="stat"><div class="stat-label">Users</div><div class="stat-value">${stats.users}</div></div>
    <div class="stat"><div class="stat-label">Active trackers</div><div class="stat-value">${stats.activeTrackers}</div></div>
    <div class="stat"><div class="stat-label">Price checks</div><div class="stat-value">${stats.priceChecks}</div></div>
    <div class="stat"><div class="stat-label">Notifications</div><div class="stat-value">${stats.notifications}</div></div>
  </div>

  <h2>Worker status</h2>
  <table>
    <thead><tr><th>Worker</th><th>Last run</th><th>Freshness</th><th>Force-run flag</th><th>Action</th></tr></thead>
    <tbody>
      <tr>
        <td>worker-prices</td>
        <td>
          ${workerStatus.lastRun
            ? `${new Date(workerStatus.lastRun).toLocaleString()} <span class="dim">(${formatRelativeAge(workerStatus.ageMs)})</span>`
            : '<span class="dim">never</span>'}
        </td>
        <td>
          ${workerStatus.freshness === 'ok'
            ? '<span class="badge active">ok</span>'
            : workerStatus.freshness === 'stale'
              ? '<span class="badge off">stale</span>'
              : '<span class="dim">n/a</span>'}
        </td>
        <td>${workerStatus.forcePending ? '<span class="badge active">pending</span>' : '<span class="dim">no</span>'}</td>
        <td>
          <form method="POST" action="/adminpage/workers/prices/run-now" style="display:inline">
            <button class="btn btn-blue">Run now</button>
          </form>
        </td>
      </tr>
    </tbody>
  </table>

  <h2>Users</h2>
  <table>
    <thead><tr><th>ID</th><th>Telegram ID</th><th>Username</th><th>Name</th><th>Trackers (all/active)</th><th>Joined</th><th>Action</th></tr></thead>
    <tbody>${userRows || empty(7)}</tbody>
  </table>

  <h2>Trackers</h2>
  <table>
    <thead><tr><th>ID</th><th>User</th><th>Route</th><th>Date</th><th>Threshold</th><th>Latest price</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${trackerRows || empty(8)}</tbody>
  </table>

  <h2>Recent price checks</h2>
  <table>
    <thead><tr><th>Tracker</th><th>Route</th><th>Price</th><th>Source</th><th>Fetched at</th></tr></thead>
    <tbody>${priceRows || empty(5)}</tbody>
  </table>

  <h2>Notifications log</h2>
  <table>
    <thead><tr><th>User</th><th>Route</th><th>Price</th><th>Status</th><th>Created at</th></tr></thead>
    <tbody>${notifRows || empty(5)}</tbody>
  </table>

  <p class="footer">Loaded ${new Date().toLocaleString()} · <a href="/adminpage">↺ Refresh</a></p>
</body>
</html>`
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export const adminRoutes = new Elysia({ prefix: '/adminpage' })

  .get('/', async ({ headers }) => {
    if (!checkAuth(headers['authorization'])) return unauth()
    const [stats, workerStatus, allUsers, allTrackers, recentPrices, recentNotifs] = await Promise.all([
      getStats(), getPriceWorkerStatus(), getAllUsers(), getAllTrackers(), getRecentPrices(), getRecentNotifications(),
    ])
    return new Response(buildHtml(stats, workerStatus, allUsers, allTrackers, recentPrices, recentNotifs), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })

  // Set force-run trigger for price worker
  .post('/workers/prices/run-now', async ({ headers }) => {
    if (!checkAuth(headers['authorization'])) return unauth()
    await redis.set('worker-prices:force-run', '1', 'EX', 300)
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })

  // Deactivate single tracker
  .post('/trackers/:id/deactivate', async ({ headers, params }) => {
    if (!checkAuth(headers['authorization'])) return unauth()
    await getDb().update(trackers).set({ isActive: false }).where(eq(trackers.id, Number(params.id)))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })

  // Ban user — deactivate ALL their trackers
  .post('/users/:id/ban', async ({ headers, params }) => {
    if (!checkAuth(headers['authorization'])) return unauth()
    await getDb().update(trackers).set({ isActive: false }).where(eq(trackers.userId, Number(params.id)))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })
