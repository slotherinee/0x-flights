import { z } from 'zod'

const iataCode = z.string().regex(/^[A-Z]{3}$/, 'Must be a 3-letter IATA code (e.g. JFK)')

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
  .refine((val) => {
    const today = new Date()
    const minDate = new Date(today)
    minDate.setDate(minDate.getDate() + 2)
    return val >= minDate.toISOString().slice(0, 10)
  }, 'Departure date must be at least 2 days from today')

export const createTrackerSchema = z.object({
  telegramId: z.string().min(1),
  origin: iataCode,
  destination: iataCode,
  departureDate: dateString,
  priceThreshold: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  adults: z.number().int().min(1).max(9).default(1),
})

export type CreateTrackerInput = z.infer<typeof createTrackerSchema>
