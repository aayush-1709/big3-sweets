'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Info, MapPin, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, X } from 'lucide-react'
import type { Product } from '@/lib/db/schema'

type Pack = 'half' | 'full' | 'piece'
type CartLine = { product: Product; pack: Pack; quantity: number }
const packInfo: Record<Pack, { label: string; short: string; price: keyof Product; stock: keyof Product }> = {
  half: { label: '500 g', short: '½ kg', price: 'priceHalfKg', stock: 'stockHalfKg' },
  full: { label: '1 kg', short: '1 kg', price: 'priceFullKg', stock: 'stockFullKg' },
  piece: { label: 'Per piece', short: 'piece', price: 'pricePiece', stock: 'stockPiece' },
}
const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`

export function SweetsMarketplace({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [activePack, setActivePack] = useState<Record<string, Pack>>({})
  const [category, setCategory] = useState('All sweets')
  const [search, setSearch] = useState('')
  const [story, setStory] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const categories = ['All sweets', 'Classics', 'Seasonal', 'Festive']
  const shownProducts = useMemo(() => products.filter((product) => (category === 'All sweets' || product.category === category) && `${product.name} ${product.origin} ${product.description}`.toLowerCase().includes(search.toLowerCase())), [products, category, search])
  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + Number(line.product[packInfo[line.pack].price] ?? 0) * line.quantity, 0)
  const checkoutUrl = `/checkout?cart=${encodeURIComponent(JSON.stringify(cart.map((line) => ({ productId: line.product.id, pack: line.pack, quantity: line.quantity }))))}`

  function addToCart(product: Product) {
    const pack = activePack[product.id] ?? (product.priceHalfKg ? 'half' : product.pricePiece ? 'piece' : 'full')
    const stock = Number(product[packInfo[pack].stock] ?? 0)
    setCart((lines) => {
      const current = lines.find((line) => line.product.id === product.id && line.pack === pack)?.quantity ?? 0
      if (current >= stock) return lines
      const found = lines.some((line) => line.product.id === product.id && line.pack === pack)
      return found ? lines.map((line) => line.product.id === product.id && line.pack === pack ? { ...line, quantity: line.quantity + 1 } : line) : [...lines, { product, pack, quantity: 1 }]
    })
    setAdded(product.id)
    window.setTimeout(() => setAdded(null), 1500)
  }
  function adjustLine(productId: string, pack: Pack, delta: number) {
    setCart((lines) => lines.map((line) => line.product.id === productId && line.pack === pack ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0))
  }

  return <main className="site-shell">
    <div className="announcement"><span>HANDMADE IN BIHAR, SHARED WITH LOVE</span><span className="announcement-note">A little piece of home, delivered to your door <ArrowRight size={12} /></span></div>
    <header className="site-header">
      <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21} /></button>
      <Link className="brand" href="/" aria-label="Big3 Sweets home"><span className="brand-mark">B<span>3</span></span><span className="brand-name">big3<span>sweets</span></span></Link>
      <nav className={mobileMenu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation"><a href="#shop" onClick={() => setMobileMenu(false)}>Shop all</a><a href="#our-story" onClick={() => setMobileMenu(false)}>Our story</a><a href="#gifting" onClick={() => setMobileMenu(false)}>Gifting</a></nav>
      <div className="header-actions"><label className="search-box"><Search size={17} /><input aria-label="Search sweets" placeholder="Find your favourite..." value={search} onChange={(event) => { setSearch(event.target.value); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }} /></label><Link href="/sign-in" className="account-link">Sign in</Link><button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${count} items`}><ShoppingBag size={18} /><span>Bag</span><span className="cart-count">{count}</span></button></div>
    </header>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> FROM THE HEART OF BIHAR</div><h1>Old recipes.<br /><em>New memories.</em></h1><p>Little-batch mithai, made the way it has been for generations. From Bihar&apos;s beloved kitchens to yours.</p><div className="hero-buttons"><a className="button button-dark" href="#shop">Explore the mithai <ArrowRight size={16} /></a><a className="text-link" href="#our-story">A story in every sweet <ArrowUpRight size={15} /></a></div><div className="hero-foot"><span><span className="dot" /> Freshly made in Bihar</span><span>Est. with love</span></div></div>
      <div className="hero-visual"><Image src="/images/bihar-sweets-hero.png" alt="An assortment of golden traditional sweets from Bihar arranged on a brass platter" fill priority sizes="(max-width: 760px) 100vw, 54vw" className="hero-image" /><div className="hero-image-tag"><span className="tag-sun">✳</span><span>MADE IN<br /><strong>BIHAR</strong></span></div><div className="hero-caption"><MapPin size={13} /> A taste of home, from Silao to Gaya</div></div>
      <div className="hero-index">01 <span /> 03</div>
    </section>
    <section className="trust-strip" aria-label="Our promises"><div className="trust-item"><span className="trust-icon">01</span><span><strong>Made in small batches</strong><small>Nothing sits on a shelf for long</small></span></div><div className="trust-item"><span className="trust-icon">02</span><span><strong>Real Bihar origins</strong><small>Know the place behind every bite</small></span></div><div className="trust-item"><span className="trust-icon">03</span><span><strong>Made for sharing</strong><small>Carefully packed, ready to gift</small></span></div><div className="strip-note">GOOD THINGS TAKE<br />A LITTLE TIME <ArrowDown size={14} /></div></section>
    <section className="shop-section" id="shop"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE SWEET SHOP</div><h2>A box full of <em>belonging.</em></h2><p>Every recipe has a home. Find yours.</p></div><a className="text-link desktop-link" href="#our-story">How we make it <ArrowUpRight size={15} /></a></div>
      <div className="shop-toolbar"><div className="category-tabs" role="tablist" aria-label="Filter by sweet type">{categories.map((item) => <button key={item} className={category === item ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(item)} role="tab" aria-selected={category === item}>{item}</button>)}</div><span className="results-count">{shownProducts.length} SWEETS TO DISCOVER</span></div>
      <div className="product-grid">{shownProducts.map((product, index) => {
        const pack = activePack[product.id] ?? (product.priceHalfKg ? 'half' : product.pricePiece ? 'piece' : 'full')
        const price = product[packInfo[pack].price] as number | null
        const stock = Number(product[packInfo[pack].stock] ?? 0)
        return <article className="product-card" key={product.id}>
          <div className={`product-image-wrap product-tone-${index % 4}`}><Image src={product.image} alt={`${product.name}, a Bihar-origin sweet`} fill sizes="(max-width: 700px) 50vw, 25vw" className={`product-image product-crop-${index % 4}`} /><span className="origin-chip"><MapPin size={11} /> {product.origin.split(',')[0]}</span><button className="info-button" onClick={() => setStory(product)} aria-label={`Read the story of ${product.name}`}><Info size={17} /><span>Our story</span></button>{product.isFeatured && <span className="product-badge"><Sparkles size={11} /> LOCAL FAVOURITE</span>}</div>
          <div className="product-info"><div className="product-title-row"><div><h3>{product.name}</h3><p>{product.description}</p></div><button className="save-button" aria-label={`Save ${product.name}`}><Heart size={17} /></button></div><div className="product-meta"><span className="product-origin"><MapPin size={12} /> {product.origin}</span><span className="stock-note">{stock > 0 ? `${stock} batches left` : 'Sold out'}</span></div><div className="product-bottom"><div className="pack-selector" aria-label={`Choose pack size for ${product.name}`}>{(['half', 'full', 'piece'] as Pack[]).filter((item) => product[packInfo[item].price] !== null).map((item) => <button key={item} onClick={() => setActivePack({ ...activePack, [product.id]: item })} className={pack === item ? 'pack-option selected' : 'pack-option'} aria-pressed={pack === item}>{packInfo[item].short}</button>)}</div><div className="price-add"><div><strong>{price ? formatPrice(price) : '—'}</strong><small>{packInfo[pack].label}</small></div><button className={added === product.id ? 'add-button added' : 'add-button'} disabled={stock === 0} onClick={() => addToCart(product)} aria-label={`Add ${product.name} to bag`}>{added === product.id ? <Check size={17} /> : <Plus size={17} />}</button></div></div></div>
        </article>
      })}</div>{shownProducts.length === 0 && <div className="empty-results">No sweets found. Try another search or browse all our mithai.</div>}
      <div className="shop-note"><span className="note-flower">✳</span><span>Every order is packed fresh. Choose a size that feels right, we&apos;ll take care of the rest.</span><span className="note-dash" /></div>
    </section>
    <section className="story-section" id="our-story"><div className="story-ornament">✳ &nbsp; BIHAR, BY HEART &nbsp; ✳</div><div className="story-copy"><div className="eyebrow"><span className="eyebrow-line" /> OUR LITTLE PROMISE</div><h2>Some flavours<br />feel like <em>coming home.</em></h2><p>We believe a sweet is more than a treat. It&apos;s a train journey back to Gaya, a Chhath morning in the courtyard, a tin box sent across the miles. Big3 brings Bihar&apos;s most loved recipes to every table, wherever home may be.</p><a className="button button-outline" href="#shop">Meet our makers <ArrowRight size={16} /></a></div><div className="story-stats"><div><strong>3</strong><span>generations<br />of recipes</span></div><div><strong>100%</strong><span>made in<br />Bihar</span></div><div><strong>∞</strong><span>reasons to<br />share</span></div></div></section>
    <section className="gift-section" id="gifting"><div className="gift-mark">B<span>3</span></div><div><span className="gift-kicker">A LITTLE BOX OF HOME</span><h2>Send a little <em>sweetness.</em></h2><p>Make someone&apos;s day with a thoughtfully packed taste of Bihar.</p></div><a className="button button-light" href="#shop">Explore gifting <ArrowRight size={16} /></a><span className="gift-decoration">✳</span></section>
    <footer className="site-footer"><div className="footer-top"><Link className="brand footer-brand" href="/"><span className="brand-mark">B<span>3</span></span><span className="brand-name">big3<span>sweets</span></span></Link><p>From our Bihar to your home.<br />Made with a little extra love.</p><div className="footer-links"><a href="#shop">Shop sweets</a><a href="#our-story">Our story</a><Link href="/sign-in">Your account</Link><Link href="/admin">Admin</Link></div><button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP ↑</button></div><div className="footer-bottom"><span>© 2025 BIG3 SWEETS. MADE WITH PRIDE IN BIHAR.</span><span>SMALL BATCHES. BIG HEARTS.</span></div></footer>
    {story && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setStory(null) }}><section className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-title"><button className="modal-close" onClick={() => setStory(null)} aria-label="Close story"><X size={19} /></button><span className="modal-kicker"><MapPin size={13} /> A LITTLE PLACE CALLED {story.origin.toUpperCase()}</span><h2 id="story-title">The story of <em>{story.name}</em></h2><p>{story.story}</p><div className="modal-foot"><span>HANDMADE IN BIHAR</span><button className="button button-dark" onClick={() => { setStory(null); addToCart(story) }}>Taste this story <ArrowRight size={15} /></button></div></section></div>}
    {cartOpen && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="drawer-head"><div><span className="drawer-kicker">A BOX OF GOOD THINGS</span><h2 id="cart-title">Your bag <span>({count})</span></h2></div><button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={19} /></button></div>{cart.length === 0 ? <div className="cart-empty"><span className="empty-icon"><ShoppingBag size={24} /></span><h3>A little room for sweetness.</h3><p>Your bag is waiting for its first mithai.</p><button className="button button-dark" onClick={() => setCartOpen(false)}>Find your favourite <ArrowRight size={15} /></button></div> : <><div className="cart-lines">{cart.map((line) => <div className="cart-line" key={`${line.product.id}-${line.pack}`}><div className="cart-thumb"><Image src={line.product.image} alt="" fill sizes="80px" /></div><div className="cart-line-detail"><strong>{line.product.name}</strong><small>{packInfo[line.pack].label} · {line.product.origin}</small><div className="quantity-control"><button onClick={() => adjustLine(line.product.id, line.pack, -1)} aria-label="Decrease quantity"><Minus size={12} /></button><span>{line.quantity}</span><button onClick={() => adjustLine(line.product.id, line.pack, 1)} aria-label="Increase quantity"><Plus size={12} /></button></div></div><strong className="line-price">{formatPrice(Number(line.product[packInfo[line.pack].price] ?? 0) * line.quantity)}</strong></div>)}</div><div className="cart-summary"><p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p><small>Shipping calculated at checkout. Packed fresh, always.</small><Link href={checkoutUrl} className="button button-dark checkout-button">Continue to checkout <ArrowRight size={15} /></Link><button className="continue-link" onClick={() => setCartOpen(false)}>Keep browsing <ChevronDown size={13} /></button></div></>}</aside></div>}
  </main>
}
