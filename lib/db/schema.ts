import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  role: text('role').notNull().default('customer'),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), accessToken: text('accessToken'), refreshToken: text('refreshToken'),
  idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(), updatedAt: timestamp('updatedAt').defaultNow(),
})
export const products = pgTable('products', {
  id: text('id').primaryKey(), name: text('name').notNull(), slug: text('slug').notNull().unique(), description: text('description').notNull(),
  origin: text('origin').notNull(), story: text('story').notNull(), category: text('category').notNull(), image: text('image').notNull(),
  priceHalfKg: integer('priceHalfKg'), priceFullKg: integer('priceFullKg'), pricePiece: integer('pricePiece'),
  stockHalfKg: integer('stockHalfKg').notNull().default(0), stockFullKg: integer('stockFullKg').notNull().default(0), stockPiece: integer('stockPiece').notNull().default(0),
  isFeatured: boolean('isFeatured').notNull().default(false), isAvailable: boolean('isAvailable').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const marketplaceOrders = pgTable('marketplace_orders', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), stripeSessionId: text('stripeSessionId').notNull().unique(),
  status: text('status').notNull().default('pending'), amountPaise: integer('amountPaise').notNull(), currency: text('currency').notNull().default('inr'),
  items: jsonb('items').notNull(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export type Product = typeof products.$inferSelect
