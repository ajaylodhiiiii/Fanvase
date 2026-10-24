// Server-only helper for Dodo Payments (https://docs.dodopayments.com).
// Used for creator platform subscriptions (Basic / Pro) in Manage Plans.

const BASES = {
  live: 'https://live.dodopayments.com',
  test: 'https://test.dodopayments.com',
}

// Product IDs come from the Dodo dashboard. Defaults are the products that the
// old hosted payment links pointed to, so behaviour is unchanged until you set
// DODO_PRODUCT_BASIC / DODO_PRODUCT_PRO.
export const DODO_PRODUCTS = {
  basic: process.env.DODO_PRODUCT_BASIC || 'pdt_0NdP9397LP3ErawjkZKca',
  pro: process.env.DODO_PRODUCT_PRO || 'pdt_0NcsAkONrZNeshm0HK50V',
}

// The old links used quantity=1000, so that is the default here. If your Dodo
// products are priced for a single unit ($5 / $20), set DODO_PRODUCT_QUANTITY=1.
function productQuantity() {
  const q = parseInt(process.env.DODO_PRODUCT_QUANTITY || '1000', 10)
  return Number.isFinite(q) && q > 0 ? q : 1
}

export async function createDodoCheckout({ plan, email, name, returnUrl, cancelUrl, metadata }) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY
  if (!apiKey) throw new Error('Payments are not configured yet (missing DODO_PAYMENTS_API_KEY).')

  const mode = (process.env.DODO_PAYMENTS_ENV || 'live').toLowerCase() === 'test' ? 'test' : 'live'
  const productId = DODO_PRODUCTS[plan]
  if (!productId) throw new Error('Unknown plan')

  const body = {
    product_cart: [{ product_id: productId, quantity: productQuantity() }],
    customer: { email, ...(name ? { name } : {}) },
    return_url: returnUrl,
    cancel_url: cancelUrl,
    metadata,
  }

  const res = await fetch(`${BASES[mode]}/checkouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  let data = null
  try { data = await res.json() } catch (e) {}
  if (!res.ok || !data?.checkout_url) {
    console.error('Dodo checkout error', res.status, data)
    throw new Error(data?.message || data?.error || 'Could not start checkout. Please try again.')
  }
  return { sessionId: data.session_id, checkoutUrl: data.checkout_url }
}
