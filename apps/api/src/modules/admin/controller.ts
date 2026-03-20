import { Elysia } from 'elysia'
import { adminAuthMiddleware } from './auth'
import { renderAdminPage } from './view'
import {
  getAdminPageData,
  runPriceWorkerNow,
  deactivateTrackerById,
  activateTrackerById,
  banUserById,
  unbanUserById,
} from './service'

function toPage(value: unknown): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return 1
  return n
}

export const adminRoutes = new Elysia({ prefix: '/adminpage' })
  .use(adminAuthMiddleware)

  .get('/', async ({ query }) => {
    const data = await getAdminPageData({
      usersPage: toPage((query as Record<string, unknown>)['usersPage']),
      trackersPage: toPage((query as Record<string, unknown>)['trackersPage']),
      pricesPage: toPage((query as Record<string, unknown>)['pricesPage']),
      notificationsPage: toPage((query as Record<string, unknown>)['notificationsPage']),
    })

    const activeTabRaw = String((query as Record<string, unknown>)['tab'] ?? 'overview')
    const activeTab =
      activeTabRaw === 'users' ||
      activeTabRaw === 'trackers' ||
      activeTabRaw === 'prices' ||
      activeTabRaw === 'notifications'
        ? activeTabRaw
        : 'overview'

    return new Response(renderAdminPage(data, activeTab), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })

  .post('/workers/prices/run-now', async () => {
    await runPriceWorkerNow()
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })

  .post('/trackers/:id/deactivate', async ({ params }) => {
    await deactivateTrackerById(Number(params.id))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })

  .post('/trackers/:id/activate', async ({ params }) => {
    await activateTrackerById(Number(params.id))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })

  .post('/users/:id/ban', async ({ params }) => {
    await banUserById(Number(params.id))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })

  .post('/users/:id/unban', async ({ params }) => {
    await unbanUserById(Number(params.id))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })
