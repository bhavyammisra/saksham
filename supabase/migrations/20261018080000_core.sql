-- Saksham backend core (BUILD_PLAN §8, D-043).
-- Teachers sign in by email; children sign in anonymously and join a class with a code and a first name.
-- Every table has row level security. Children reach a class only through join_class(); the
-- teacher side only reads its own classes. No child free text is ever stored here.

-- ---------------------------------------------------------------- helpers (not exposed to the API)

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- A first name: 1 to 20 letters in Latin or an Indian script (with vowel signs), single spaces between words.
-- The ranges are U+00C0 to U+024F (accented Latin) and U+0900 to U+0DFF (Devanagari to Sinhala).
-- shortcut: lists scripts explicitly because Postgres doesn't count vowel signs as letters; add a block if a name in another script is refused.
create function private.is_valid_first_name(name text) returns boolean
language sql immutable set search_path = '' as $$
  select name is not null
     and char_length(name) between 1 and 20
     and name ~ '^[A-Za-zÀ-ɏऀ-෿]+( [A-Za-zÀ-ɏऀ-෿]+)*$'
$$;

-- Join codes: 6 characters with no 0/O/1/I (easy to read out in a classroom).
create function private.new_join_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 characters, so each random byte maps evenly
  bytes bytea := extensions.gen_random_bytes(6);
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, get_byte(bytes, i) % 32 + 1, 1);
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------- tables

create table public.user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('teacher', 'reviewer', 'admin'))
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  join_code text not null unique default private.new_join_code() check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  code_active boolean not null default true,
  mission_target integer not null default 20 check (mission_target between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key references auth.users on delete cascade, -- the child's anonymous auth.uid()
  class_id uuid not null references public.classes on delete cascade,
  first_name text not null check (private.is_valid_first_name(first_name)),
  band text not null check (band in ('young', 'teen')),
  avatar jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.progress (
  student_id uuid not null default auth.uid() references public.students on delete cascade,
  building_id text not null check (building_id ~ '^[a-z0-9-]{1,40}$'),
  stars integer not null check (stars between 0 and 3),
  best_score integer not null check (best_score between 0 and 100),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_id, building_id)
);

create table public.student_extras (
  student_id uuid primary key default auth.uid() references public.students on delete cascade,
  cards text[] not null default '{}',
  badges text[] not null default '{}',
  marigolds text[] not null default '{}',
  pledges text[] not null default '{}' -- preset pledge ids only, never free text
);

create table public.quiz_attempts (
  id bigint generated always as identity primary key,
  student_id uuid not null default auth.uid() references public.students on delete cascade,
  building_id text not null check (building_id ~ '^[a-z0-9-]{1,40}$'),
  question_id text not null check (question_id ~ '^[a-z0-9-]{1,60}$'),
  correct boolean not null,
  at timestamptz not null default now()
);

-- Reviewable content: only hashes and status. The text itself lives in the app's content files.
create table public.content_items (
  id text primary key, -- e.g. "card:school:en"
  kind text not null check (kind in ('card', 'quiz', 'help', 'scene')),
  lang text not null check (lang in ('en', 'hi')),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'rejected')),
  submitted_by uuid references auth.users on delete set null,
  reviewed_by uuid references auth.users on delete set null,
  reviewed_at timestamptz,
  reviewer_note text check (char_length(reviewer_note) <= 500)
);

create table public.content_events (
  id bigint generated always as identity primary key,
  item_id text not null references public.content_items on delete cascade,
  actor_id uuid references auth.users on delete set null,
  from_status text,
  to_status text not null,
  note text check (char_length(note) <= 500),
  at timestamptz not null default now()
);

create index on public.classes (teacher_id);
create index on public.students (class_id);
create index on public.quiz_attempts (student_id);
create index on public.content_events (item_id);

-- ---------------------------------------------------------------- merge rules (BUILD_PLAN §7)

-- Progress only ever goes up: stars and best score take the max, completed stays true.
create function private.keep_best_progress() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.stars := greatest(old.stars, new.stars);
  new.best_score := greatest(old.best_score, new.best_score);
  new.completed := old.completed or new.completed;
  new.updated_at := now();
  return new;
end;
$$;
create trigger keep_best before update on public.progress for each row execute function private.keep_best_progress();

-- Extras only ever grow: each list is the union of what was saved and what is sent.
create function private.union_extras() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.cards := array(select distinct unnest(old.cards || new.cards) order by 1);
  new.badges := array(select distinct unnest(old.badges || new.badges) order by 1);
  new.marigolds := array(select distinct unnest(old.marigolds || new.marigolds) order by 1);
  new.pledges := array(select distinct unnest(old.pledges || new.pledges) order by 1);
  return new;
end;
$$;
create trigger union_lists before update on public.student_extras for each row execute function private.union_extras();

-- A new email user becomes a teacher. Anonymous users (children) get no role.
create function private.on_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(new.is_anonymous, false) then
    insert into public.user_roles (user_id, role) values (new.id, 'teacher') on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger on_new_user after insert on auth.users for each row execute function private.on_new_user();

-- ---------------------------------------------------------------- who is asking (used by the policies)

create function private.has_role(wanted text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = wanted)
$$;

create function private.my_class_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select class_id from public.students where id = (select auth.uid())
$$;

create function private.teaches(class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes where id = class and teacher_id = (select auth.uid()))
$$;

create function private.teaches_student(student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.students s join public.classes c on c.id = s.class_id
    where s.id = student and c.teacher_id = (select auth.uid())
  )
$$;

revoke all on all functions in schema private from public;
grant execute on function private.has_role(text), private.my_class_id(), private.teaches(uuid), private.teaches_student(uuid),
  private.is_valid_first_name(text), private.new_join_code() to authenticated;

-- ---------------------------------------------------------------- row level security

alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.progress enable row level security;
alter table public.student_extras enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.content_items enable row level security;
alter table public.content_events enable row level security;

-- Nothing is reachable without signing in.
revoke all on all tables in schema public from anon, authenticated;

create policy "read own role" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
grant select on public.user_roles to authenticated;

-- Classes: a teacher manages their own; a child sees only the class they joined.
create policy "teacher reads own classes" on public.classes for select to authenticated
  using (teacher_id = (select auth.uid()) or id = (select private.my_class_id()));
create policy "teacher creates classes" on public.classes for insert to authenticated
  with check (teacher_id = (select auth.uid()) and (select private.has_role('teacher')));
create policy "teacher updates own classes" on public.classes for update to authenticated
  using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
grant select, insert (name, mission_target) on public.classes to authenticated;
grant update (name, code_active, mission_target) on public.classes to authenticated;

-- Students: rows are created only by join_class(). A child reads their own row; a teacher reads and removes their students.
create policy "child reads self, teacher reads class" on public.students for select to authenticated
  using (id = (select auth.uid()) or (select private.teaches(class_id)));
create policy "teacher removes a student" on public.students for delete to authenticated
  using ((select private.teaches(class_id)));
grant select, delete on public.students to authenticated;

-- Progress, extras and quiz attempts: a child writes their own; their teacher reads them.
create policy "child reads own, teacher reads class" on public.progress for select to authenticated
  using (student_id = (select auth.uid()) or (select private.teaches_student(student_id)));
create policy "child adds own" on public.progress for insert to authenticated with check (student_id = (select auth.uid()));
create policy "child updates own" on public.progress for update to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
grant select, insert, update on public.progress to authenticated;

create policy "child reads own, teacher reads class" on public.student_extras for select to authenticated
  using (student_id = (select auth.uid()) or (select private.teaches_student(student_id)));
create policy "child adds own" on public.student_extras for insert to authenticated with check (student_id = (select auth.uid()));
create policy "child updates own" on public.student_extras for update to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
grant select, insert, update on public.student_extras to authenticated;

create policy "child reads own, teacher reads class" on public.quiz_attempts for select to authenticated
  using (student_id = (select auth.uid()) or (select private.teaches_student(student_id)));
create policy "child adds own" on public.quiz_attempts for insert to authenticated with check (student_id = (select auth.uid()));
grant select, insert (student_id, building_id, question_id, correct) on public.quiz_attempts to authenticated;

-- Content review: anyone signed in may read an item's status (for the "Reviewed" tick); only the RPCs change it.
create policy "read status" on public.content_items for select to authenticated using (true);
grant select on public.content_items to authenticated;
create policy "reviewers read the log" on public.content_events for select to authenticated
  using ((select private.has_role('reviewer')) or (select private.has_role('admin')));
grant select on public.content_events to authenticated;

-- ---------------------------------------------------------------- views for the teacher (they use the caller's own rights)

create view public.class_progress_summary with (security_invoker = true) as
  select s.class_id, p.building_id,
         count(*) filter (where p.completed) as completed_count,
         round(avg(p.stars), 2) as average_stars,
         round(avg(p.best_score), 1) as average_score
  from public.progress p join public.students s on s.id = p.student_id
  group by s.class_id, p.building_id;

-- Common mistakes: first attempts only, as in the game's scoring.
create view public.class_question_stats with (security_invoker = true) as
  with first_try as (
    select distinct on (a.student_id, a.building_id, a.question_id) a.*
    from public.quiz_attempts a
    order by a.student_id, a.building_id, a.question_id, a.at
  )
  select s.class_id, f.building_id, f.question_id,
         count(*) as answered,
         count(*) filter (where not f.correct) as wrong
  from first_try f join public.students s on s.id = f.student_id
  group by s.class_id, f.building_id, f.question_id;

-- The cooperative Class Mission: one total for the class, never per child.
create view public.class_mission with (security_invoker = true) as
  select c.id as class_id, c.mission_target, coalesce(sum(p.stars), 0)::integer as total_stars
  from public.classes c
  left join public.students s on s.class_id = c.id
  left join public.progress p on p.student_id = s.id
  group by c.id, c.mission_target;

revoke all on public.class_progress_summary, public.class_question_stats, public.class_mission from anon, authenticated;
grant select on public.class_progress_summary, public.class_question_stats, public.class_mission to authenticated;

-- ---------------------------------------------------------------- RPCs (they check their own inputs)

-- A child (signed in anonymously) joins a class with its code and their first name.
-- Returns the class id and name. Wrong or switched-off codes give the same error, so codes can't be probed.
create function public.join_class(code text, first_name text, band text, avatar jsonb default '{}')
returns table (class_id uuid, class_name text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  me uuid := auth.uid();
  clean_name text := regexp_replace(btrim(coalesce(first_name, '')), '\s+', ' ', 'g');
  found public.classes;
begin
  if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise exception 'only a child account can join a class' using errcode = '42501';
  end if;
  if not private.is_valid_first_name(clean_name) then raise exception 'invalid first name' using errcode = '22023'; end if;
  if band not in ('young', 'teen') then raise exception 'invalid band' using errcode = '22023'; end if;
  if jsonb_typeof(avatar) is distinct from 'object' or pg_column_size(avatar) > 2000 then
    raise exception 'invalid avatar' using errcode = '22023';
  end if;
  select * into found from public.classes c where c.join_code = upper(btrim(code)) and c.code_active;
  if found.id is null then raise exception 'unknown or inactive code' using errcode = 'P0002'; end if;

  insert into public.students (id, class_id, first_name, band, avatar)
  values (me, found.id, clean_name, band, avatar)
  on conflict (id) do update set class_id = excluded.class_id, first_name = excluded.first_name,
    band = excluded.band, avatar = excluded.avatar;
  insert into public.student_extras (student_id) values (me) on conflict do nothing;
  return query select found.id, found.name;
end;
$$;

-- A child leaves their class: their class data is deleted (the game on their device keeps everything).
create function public.leave_class() returns void
language sql security definer set search_path = '' as $$
  delete from public.students where id = (select auth.uid())
$$;

create function public.rotate_join_code(class uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare fresh text;
begin
  if not private.teaches(class) then raise exception 'not your class' using errcode = '42501'; end if;
  loop
    fresh := private.new_join_code();
    begin
      update public.classes set join_code = fresh where id = class;
      return fresh;
    exception when unique_violation then
      -- extremely rare: try another code
    end;
  end loop;
end;
$$;

create function public.delete_class(class uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.teaches(class) then raise exception 'not your class' using errcode = '42501'; end if;
  delete from public.classes where id = class;
end;
$$;

-- Reviewers and admins only. A new hash for an item sends it back to review.
create function public.submit_content_for_review(item text, item_kind text, item_lang text, hash text)
returns void
language plpgsql security definer set search_path = '' as $$
declare before text;
begin
  if not (private.has_role('reviewer') or private.has_role('admin')) then
    raise exception 'reviewers only' using errcode = '42501';
  end if;
  select status into before from public.content_items where id = item;
  insert into public.content_items (id, kind, lang, content_hash, status, submitted_by)
  values (item, item_kind, item_lang, hash, 'in_review', auth.uid())
  on conflict (id) do update set content_hash = excluded.content_hash, status = 'in_review',
    submitted_by = excluded.submitted_by, reviewed_by = null, reviewed_at = null, reviewer_note = null
  where public.content_items.content_hash is distinct from excluded.content_hash or public.content_items.status = 'draft';
  insert into public.content_events (item_id, actor_id, from_status, to_status) values (item, auth.uid(), before, 'in_review');
end;
$$;

create function public.review_content(item text, decision text, note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare before text;
begin
  if not private.has_role('reviewer') then raise exception 'reviewers only' using errcode = '42501'; end if;
  if decision not in ('published', 'rejected', 'in_review') then raise exception 'invalid decision' using errcode = '22023'; end if;
  if decision = 'rejected' and coalesce(btrim(note), '') = '' then raise exception 'a rejection needs a note' using errcode = '22023'; end if;
  select status into before from public.content_items where id = item for update;
  if before is null then raise exception 'unknown item' using errcode = 'P0002'; end if;
  update public.content_items
  set status = decision, reviewed_by = auth.uid(), reviewed_at = now(), reviewer_note = note
  where id = item;
  insert into public.content_events (item_id, actor_id, from_status, to_status, note) values (item, auth.uid(), before, decision, note);
end;
$$;

revoke all on function public.join_class(text, text, text, jsonb), public.leave_class(), public.rotate_join_code(uuid),
  public.delete_class(uuid), public.submit_content_for_review(text, text, text, text), public.review_content(text, text, text)
  from public, anon;
grant execute on function public.join_class(text, text, text, jsonb), public.leave_class(), public.rotate_join_code(uuid),
  public.delete_class(uuid), public.submit_content_for_review(text, text, text, text), public.review_content(text, text, text)
  to authenticated;
