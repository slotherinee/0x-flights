import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AdminPageViewModel } from '../types'

const templatePath = join(import.meta.dir, '../html/page.hbs')
const templateSource = readFileSync(templatePath, 'utf8')

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

const renderTemplate = Handlebars.compile(templateSource)

export function renderTemplateHtml(viewModel: AdminPageViewModel): string {
  return renderTemplate(viewModel)
}
