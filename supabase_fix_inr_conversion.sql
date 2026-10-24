-- ============================================================
-- ONE-TIME FIX: INR sales that were credited to wallets as if they were USD.
-- Run in Supabase Dashboard -> SQL Editor.
-- Rate: $1 = ₹85  (same as lib/currency.js)
--
-- STEP 1: run the PREVIEW query alone and check the numbers.
-- STEP 2: run the FIX block (everything between BEGIN and COMMIT) once.
-- ============================================================

-- ---------- STEP 1: PREVIEW (read-only) ----------
select
  p.username,
  count(*)                                   as inr_sales,
  sum(t.amount)                              as inr_total,
  round(sum(t.amount * 0.9), 2)              as credited_wrongly_usd,
  round(sum(t.amount / 85 * 0.9), 2)         as should_have_credited_usd,
  b.available                                as current_available,
  b.pending                                  as current_pending
from public.transactions t
join public.profiles p on p.id = t.creator_id
left join public.creator_balances b on b.creator_id = t.creator_id
where t.currency = 'INR'
  and t.type in ('subscription', 'onetime')
  and t.status = 'completed'
group by p.username, b.available, b.pending
order by p.username;

-- ---------- STEP 2: FIX (run once) ----------
begin;

-- 2a. Take back the over-credited amount from each creator's wallet.
with fix as (
  select creator_id,
         sum(amount * 0.9)       as wrong,
         sum(amount / 85 * 0.9)  as correct
  from public.transactions
  where currency = 'INR'
    and type in ('subscription', 'onetime')
    and status = 'completed'
  group by creator_id
)
update public.creator_balances b
set available    = greatest(0, b.available    - (f.wrong - f.correct)),
    total_earned = greatest(0, b.total_earned - (f.wrong - f.correct)),
    updated_at   = now()
from fix f
where b.creator_id = f.creator_id;

-- 2b. Convert those transactions to USD so revenue totals and charts are right.
update public.transactions
set description = coalesce(description, '') || ' (₹' || amount || ' @ ₹85/$)',
    amount      = round(amount / 85, 2),
    currency    = 'USD'
where currency = 'INR'
  and type in ('subscription', 'onetime')
  and status = 'completed';

commit;

-- NOTE: if a creator already requested a withdrawal based on the inflated balance,
-- their "pending" amount / payout row is not changed by this script. Check the
-- Payouts tab in the admin panel and correct that payout manually before paying it.
