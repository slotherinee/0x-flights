import { Elysia, t } from 'elysia'
import { env } from '@0x-flights/config'
import { getDb } from '@0x-flights/db'
import { users, trackers, prices, notifications } from '@0x-flights/db'
import { eq, desc, count, and } from 'drizzle-orm'

// ─── Basic Auth helper ────────────────────────────────────────────────────────
function checkAuth(authHeader: string | undefined): boolean {
  if (!authHeader?.startsWith('Basic ')) return false
  const decoded = atob(authHeader.slice(6))
  const [user, ...rest] = decoded.split(':')
  const pass = rest.join(':')
  return user === env.ADMIN_USER && pass === env.ADMIN_PASSWORD
}

function unauthorizedResponse() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="0x-flights admin"' },
  })
}

// ─── Data fetchers ────────────────────────────────────────────────────────────
async function getStats() {
  const db = getDb()
  const [[userCount], [trackerCount], [priceCount], [notifCount]] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(trackers).where(eq(trackers.isActive, true)),
    db.select({ count: count() }).from(prices),
    db.select({ count: count() }).from(notifications),
  ])
  return {
    users: userCount?.count ?? 0,
    activeTrackers: trackerCount?.count ?? 0,
    priceChecks: priceCount?.count ?? 0,
    notifications: notifCount?.count ?? 0,
  }
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
      id: prices.id,
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

// ─── HTML renderer ────────────────────────────────────────────────────────────
function html(stats: Awaited<ReturnType<typeof getStats>>, allTrackers: Awaited<ReturnType<typeof getAllTrackers>>, recentPrices: Awaited<ReturnType<typeof getRecentPrices>>) {
  const trackerRows = allTrackers.map((t) => `
    <tr class="${t.isActive ? '' : 'inactive'}">
      <td>#${t.id}</td>
      <td>${t.telegramId ?? '—'}</td>
      <td>${t.username ? '@' + t.username : '—'}</td>
      <td><b>${t.origin?.trim()}→${t.destination?.trim()}</b></td>
      <td>${t.departureDate}</td>
      <td>${t.priceThreshold} ${t.currency?.trim()}</td>
      <td><span class="badge ${t.isActive ? 'active' : 'off'}">${t.isActive ? 'active' : 'off'}</span></td>
      <td>
        ${t.isActive ? `<form method="POST" action="/adminpage/trackers/${t.id}/deactivate" style="display:inline">
          <button class="btn-del" onclick="return confirm('Deactivate #${t.id}?')">Deactivate</button>
        </form>` : '—'}
      </td>
    </tr>`).join('')

  const priceRows = recentPrices.map((p) => `
    <tr>
      <td>#${p.trackerId}</td>
      <td>${p.origin?.trim()}→${p.destination?.trim()}</td>
      <td><b>${p.price} ${p.currency?.trim()}</b></td>
      <td>${p.source}</td>
      <td>${new Date(p.fetchedAt).toLocaleString()}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>0x-flights admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
    body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d0d0d; color: #e0e0e0; padding: 32px }
    h1 { font-size: 1.2rem; color: #fff; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase }
    h2 { font-size: 0.85rem; color: #888; margin: 32px 0 12px; text-transform: uppercase; letter-spacing: 1px }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px }
    .stat { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 16px }
    .stat-label { font-size: 0.7rem; color: #666; margin-bottom: 6px; text-transform: uppercase }
    .stat-value { font-size: 1.8rem; color: #fff; font-weight: 700 }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem }
    th { text-align: left; color: #555; padding: 8px 10px; border-bottom: 1px solid #222; font-weight: 400 }
    td { padding: 8px 10px; border-bottom: 1px solid #1a1a1a; color: #ccc }
    tr.inactive td { opacity: 0.4 }
    tr:hover td { background: #141414 }
    .badge { padding: 2px 8px; border-radius: 3px; font-size: 0.7rem; text-transform: uppercase }
    .badge.active { background: #0f2e1a; color: #4ade80 }
    .badge.off { background: #2a1a1a; color: #f87171 }
    .btn-del { background: #2a1010; color: #f87171; border: 1px solid #3d1515; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-family: inherit }
    .btn-del:hover { background: #3d1515 }
    .refresh { font-size: 0.7rem; color: #444; margin-top: 32px }
    a { color: #666; text-decoration: none }
    a:hover { color: #aaa }
  </style>
</head>
<body>
  <h1>✈ 0x-flights · admin</h1>

  <div class="stats">
    <div class="stat"><div class="stat-label">Users</div><div class="stat-value">${stats.users}</div></div>
    <div class="stat"><div class="stat-label">Active trackers</div><div class="stat-value">${stats.activeTrackers}</div></div>
    <div class="stat"><div class="stat-label">Price checks</div><div class="stat-value">${stats.priceChecks}</div></div>
    <div class="stat"><div class="stat-label">Notifications</div><div class="stat-value">${stats.notifications}</div></div>
  </div>

  <h2>Trackers</h2>
  <table>
    <thead><tr>
      <th>ID</th><th>Telegram ID</th><th>Username</th><th>Route</th>
      <th>Date</th><th>Threshold</th><th>Status</th><th>Action</th>
    </tr></thead>
    <tbody>${trackerRows || '<tr><td colspan="8" style="color:#444;padding:20px">No trackers yet</td></tr>'}</tbody>
  </table>

  <h2>Recent price checks</h2>
  <table>
    <thead><tr>
      <th>Tracker</th><th>Route</th><th>Price</th><th>Source</th><th>Fetched at</th>
    </tr></thead>
    <tbody>${priceRows || '<tr><td colspan="5" style="color:#444;padding:20px">No price data yet</td></tr>'}</tbody>
  </table>

  <p class="refresh">Last loaded: ${new Date().toLocaleString()} · <a href="/adminpage">Refresh</a></p>
</body>
</html>`
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export const adminRoutes = new Elysia({ prefix: '/adminpage' })

  // GET /adminpage — main dashboard
  .get('/', async ({ headers }) => {
    if (!checkAuth(headers['authorization'])) return unauthorizedResponse()

    const [stats, allTrackers, recentPrices] = await Promise.all([
      getStats(),
      getAllTrackers(),
      getRecentPrices(),
    ])

    return new Response(html(stats, allTrackers, recentPrices), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })

  // POST /adminpage/trackers/:id/deactivate
  .post('/trackers/:id/deactivate', async ({ headers, params }) => {
    if (!checkAuth(headers['authorization'])) return unauthorizedResponse()

    const db = getDb()
    await db
      .update(trackers)
      .set({ isActive: false })
      .where(eq(trackers.id, Number(params.id)))

    // Redirect back to admin page
    return new Response(null, {
      status: 302,
      headers: { Location: '/adminpage' },
    })
  })
