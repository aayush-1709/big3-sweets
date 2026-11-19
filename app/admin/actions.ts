'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') throw new Error('Unauthorized')
}
function positivePrice(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()
  if (!value) return null
  const price = Number(value)
  if (!Number.isInteger(price) || price < 1 || price > 10000000) throw new Error('Invalid price')
  return price
}
function stockCount(formData: FormData, key: string) {
  const count = Number(formData.get(key))
  if (!Number.isInteger(count) || count < 0 || count > 100000) throw new Error('Invalid stock count')
  return count
}

export async function updateInventory(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const origin = String(formData.get('origin') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const story = String(formData.get('story') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  if (!id || !name || name.length > 100 || !origin || origin.length > 120 || !description || description.length > 500 || !story || story.length > 1500 || !category) throw new Error('Invalid product details')
  await db.update(products).set({
    name, origin, description, story, category,
    priceHalfKg: positivePrice(formData, 'priceHalfKg'),
    priceFullKg: positivePrice(formData, 'priceFullKg'),
    pricePiece: positivePrice(formData, 'pricePiece'),
    stockHalfKg: stockCount(formData, 'stockHalfKg'),
    stockFullKg: stockCount(formData, 'stockFullKg'),
    stockPiece: stockCount(formData, 'stockPiece'),
    isAvailable: formData.get('isAvailable') === 'on',
    updatedAt: new Date(),
  }).where(eq(products.id, id))
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase()
  const origin = String(formData.get('origin') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const story = String(formData.get('story') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  if (!name || name.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !origin || origin.length > 120 || !description || description.length > 500 || !story || story.length > 1500 || !['Classics', 'Seasonal', 'Festive'].includes(category)) throw new Error('Please enter valid product details')
  const priceHalfKg = positivePrice(formData, 'priceHalfKg')
  const priceFullKg = positivePrice(formData, 'priceFullKg')
  const pricePiece = positivePrice(formData, 'pricePiece')
  if (!priceHalfKg && !priceFullKg && !pricePiece) throw new Error('Add at least one price')
  await db.insert(products).values({
    id: crypto.randomUUID(), name, slug, origin, description, story, category,
    image: '/images/bihar-sweets-hero.png', priceHalfKg, priceFullKg, pricePiece,
    stockHalfKg: 0, stockFullKg: 0, stockPiece: 0, isFeatured: formData.get('isFeatured') === 'on', isAvailable: true,
  })
  revalidatePath('/')
  revalidatePath('/admin')
}
