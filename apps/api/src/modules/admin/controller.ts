import { Elysia } from 'elysia'
import { adminAuthMiddleware } from './auth'
import { renderAdminPage } from './view'
import { getAdminPageData, runPriceWorkerNow, deactivateTrackerById, banUserById } from './service'

export const adminRoutes = new Elysia({ prefix: '/adminpage' })
  .use(adminAuthMiddleware)

  .get('/', async () => {
    const data = await getAdminPageData()
    return new Response(renderAdminPage(data), {
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

  .post('/users/:id/ban', async ({ params }) => {
    await banUserById(Number(params.id))
    return new Response(null, { status: 302, headers: { Location: '/adminpage' } })
  })
