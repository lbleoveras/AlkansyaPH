-- add-holding.tsx already validates this client-side, but a direct API call
-- could bypass that -- enforce it in the database too.
alter table public.holdings
  add constraint holdings_purchased_at_not_future check (purchased_at <= current_date);
