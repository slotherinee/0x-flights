import { Elysia } from 'elysia'
import { env } from '@0x-flights/config'
import { getDb } from '@0x-flights/db'
import { users, trackers, prices, notifications } from '@0x-flights/db'
import { eq, desc, count, sql } from 'drizzle-orm'

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

// ─── CSS (shared) ─────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d0d0d; color: #e0e0e0; padding: 32px }
  h1 { font-size: 1.1rem; color: #fff; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase }
  h2 { font-size: 0.78rem; color: #666; margin: 36px 0 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1e1e1e; padding-bottom: 8px }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px }
  .stat { background: #111; border: 1px solid #222; border-radius: 6px; padding: 16px }
  .stat-label { font-size: 0.68rem; color: #555; margin-bottom: 6px; text-transform: uppercase }
  .stat-value { font-size: 1.8rem; color: #fff; font-weight: 700 }
  table { width: 100%; border-collapse: collapse; font-size: 0.78rem }
  th { text-align: left; color: #444; padding: 8px 10px; border-bottom: 1px solid #1e1e1e; font-weight: 400 }
  td { padding: 7px 10px; border-bottom: 1px solid #161616; color: #bbb; white-space: nowrap }
  tr.inactive td { opacity: 0.35 }
  tr:hover td { background: #111 }
  .badge { padding: 2px 7px; border-radius: 3px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px }
  .badge.active { background: #0a2016; color: #4ade80 }
  .badge.off    { background: #200a0a; color: #f87171 }
  .btn { border: none; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 0.72rem; font-family: inherit }
  .btn-red  { background: #1e0a0a; color: #f87171; border: 1px solid #3d1515 }
  .btn-red:hover { background: #2e1010 }
  .btn-blue { background: #0a101e; color: #60a5fa; border: 1px solid #153060 }
  .btn-blue:hover { background: #0d1830 }
  .footer { font-size: 0.68rem; color: #333; margin-top: 40px }
  a { color: #555; text-decoration: none } a:hover { color: #999 }
  .dim { color: #444 }
  .price-tag { color: #facc15 }
  .nav { display: flex; gap: 20px; margin-bottom: 32px; font-size: 0.75rem }
  .nav a { color: #555; padding: 4px 0; border-bottom: 1px solid transparent }
  .nav a:hover { color: #aaa; border-bottom-color: #333 }
`

// ─── HTML builder ─────────────────────────────────────────────────────────────
function buildHtml(
  stats: Awaited<ReturnType<typeof getStats>>,
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
    const [stats, allUsers, allTrackers, recentPrices, recentNotifs] = await Promise.all([
      getStats(), getAllUsers(), getAllTrackers(), getRecentPrices(), getRecentNotifications(),
    ])
    return new Response(buildHtml(stats, allUsers, allTrackers, recentPrices, recentNotifs), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
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
