import { readFileSync } from 'fs'
import { join } from 'path'
import type { AdminPageData } from '../types'
import { toViewModel } from './to-view-model'
import { renderTemplateHtml } from './render-template'

const styles = readFileSync(join(import.meta.dir, '../html/style.css'), 'utf8')

export function renderAdminPage(
  data: AdminPageData,
  activeTab: 'overview' | 'users' | 'trackers' | 'prices' | 'notifications' = 'overview',
): string {
  return renderTemplateHtml(toViewModel(data, styles, activeTab))
}
