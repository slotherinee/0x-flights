import {
  pgTable,
  serial,
  text,
  integer,
  smallint,
  boolean,
  numeric,
  char,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: text('telegram_id').notNull().unique(),
  language: char('language', { length: 2 }).notNull().default('en'),
  currency: char('currency', { length: 3 }).notNull().default('USD'),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const trackers = pgTable(
  'trackers',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    origin: char('origin', { length: 3 }).notNull(),
    destination: char('destination', { length: 3 }).notNull(),
    departureDate: date('departure_date').notNull(),
    priceThreshold: numeric('price_threshold', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    adults: smallint('adults').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_trackers_user_id').on(t.userId),
    isActiveIdx: index('idx_trackers_is_active').on(t.isActive),
    routeIdx: index('idx_trackers_route').on(t.origin, t.destination, t.departureDate),
  }),
)

export const prices = pgTable(
  'prices',
  {
    id: serial('id').primaryKey(),
    trackerId: integer('tracker_id')
      .notNull()
      .references(() => trackers.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    source: text('source').notNull().default('stub'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    trackerIdIdx: index('idx_prices_tracker_id').on(t.trackerId),
    trackerTimeIdx: index('idx_prices_tracker_time').on(t.trackerId, t.fetchedAt),
  }),
)

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    trackerId: integer('tracker_id')
      .notNull()
      .references(() => trackers.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    message: text('message').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_notifications_user_id').on(t.userId),
    sentAtIdx: index('idx_notifications_sent_at').on(t.sentAt),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  trackers: many(trackers),
  notifications: many(notifications),
}))

export const trackersRelations = relations(trackers, ({ one, many }) => ({
  user: one(users, { fields: [trackers.userId], references: [users.id] }),
  prices: many(prices),
  notifications: many(notifications),
}))

export const pricesRelations = relations(prices, ({ one }) => ({
  tracker: one(trackers, { fields: [prices.trackerId], references: [trackers.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tracker: one(trackers, { fields: [notifications.trackerId], references: [trackers.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))
