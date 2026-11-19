import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { SweetsMarketplace } from '@/components/sweets-marketplace'

export default async function HomePage() {
  const items = await db.select().from(products).where(eq(products.isAvailable, true)).orderBy(asc(products.name))
  return <SweetsMarketplace products={items} />
}
