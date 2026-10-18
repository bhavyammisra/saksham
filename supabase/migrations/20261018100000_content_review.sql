-- Content review, part 2 (D-049).

-- One account may hold more than one role (the owner is a teacher and a reviewer).
alter table public.user_roles drop constraint user_roles_pkey;
alter table public.user_roles add primary key (user_id, role);

-- What every player may know about reviewed content: which items are published, their hash and
-- when they were reviewed. Nothing else (no reviewer, no notes). Children who never joined a class
-- are not signed in, so this is open to signed-out visitors too; it holds no personal data.
create function public.published_content()
returns table (id text, content_hash text, reviewed_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select id, content_hash, reviewed_at from public.content_items where status = 'published'
$$;

revoke all on function public.published_content() from public;
grant execute on function public.published_content() to anon, authenticated;
