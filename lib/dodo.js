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

// Each plan is one unit of its Dodo product ($5 Basic / $20 Pro), so quantity is 1.
// Only change DODO_PRODUCT_QUANTITY if your Dodo product is priced per unit.
function productQuantity() {
  const q = parseInt(process.env.DODO_PRODUCT_QUANTITY || '1', 10)
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

  let res
  try {
    res = await fetch(`${BASES[mode]}/checkouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (e) {
    console.error('Dodo checkout network error', e)
    throw new Error(`Could not reach Dodo Payments (${mode} mode): ${e.message}`)
  }

  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch (e) {}

  if (!res.ok || !data?.checkout_url) {
    console.error('Dodo checkout error', { mode, status: res.status, productId, body: text.slice(0, 500) })
    const pick = data?.message ?? data?.error?.message ?? data?.error ?? data?.detail ?? data?.code
    const detail = pick ? (typeof pick === 'string' ? pick : JSON.stringify(pick)) : text.slice(0, 200)
    throw new Error(`Checkout failed (Dodo ${mode} mode, HTTP ${res.status}${detail ? `: ${detail}` : ''})`)
  }
  return { sessionId: data.session_id, checkoutUrl: data.checkout_url }
}
