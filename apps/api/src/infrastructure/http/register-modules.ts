import { healthRoutes } from '../../modules/health'
import { trackerRoutes } from '../../modules/trackers'
import { telegramRoutes } from '../../modules/telegram'
import { adminRoutes } from '../../modules/admin'

export function registerModules(app: any) {
  return app.use(healthRoutes).use(trackerRoutes).use(telegramRoutes).use(adminRoutes)
}
