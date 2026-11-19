export type CheckoutPack = 'half' | 'full' | 'piece'
export type CheckoutLine = { productId: string; pack: CheckoutPack; quantity: number }
