-- Fixes from the Supabase advisors after the core migration (D-043).

-- Supabase's "automatic RLS" option adds this event-trigger function to the public API.
-- Nobody needs to call it over the API (the event trigger runs it), so take that away.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Indexes for the content-review foreign keys.
create index on public.content_events (actor_id);
create index on public.content_items (submitted_by);
create index on public.content_items (reviewed_by);
