-- RLS and RPC tests (BUILD_PLAN P5, NFR-01/NFR-02, D-043).
-- Two teachers and two children, each "signed in" by setting the JWT claims the way Supabase does.
-- Run it in the Supabase SQL editor (or through the Supabase MCP). Everything happens inside one
-- transaction that is rolled back, so it leaves no data behind. Any failed check stops the script
-- with an error that names the check; "RLS tests passed" at the end means every check passed.

begin;

-- ---------------------------------------------------------------- helpers

-- Act as a signed-in user: the role PostgREST uses, plus the JWT claims auth.uid() and auth.jwt() read.
create function pg_temp.act_as(user_id uuid, anonymous boolean) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated', 'is_anonymous', anonymous)::text, true);
$$;
-- Back to the database owner: run `reset role;` first (a signed-in user can't become the owner), then this.
create function pg_temp.act_as_admin() returns void language sql as $$
  select set_config('request.jwt.claims', '', true);
$$;
create function pg_temp.ok(passed boolean, what text) returns void language plpgsql as $$
begin
  if passed is not true then raise exception 'FAILED: %', what; end if;
end;
$$;
-- Runs `statement` and checks that it fails.
create function pg_temp.fails(statement text, what text) returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'FAILED (it worked, but should not): %', what;
exception when others then
  if sqlerrm like 'FAILED%' then raise; end if;
end;
$$;
grant execute on all functions in schema pg_temp to authenticated, anon;

-- ---------------------------------------------------------------- people

insert into auth.users (id, email, is_anonymous, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'teacher.a@example.test', false, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'teacher.b@example.test', false, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', null, true, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', null, true, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c3', null, true, 'authenticated', 'authenticated');

select pg_temp.ok((select count(*) from public.user_roles where role = 'teacher') = 2, 'email users become teachers');
select pg_temp.ok(not exists (select 1 from public.user_roles where user_id::text like '%c_'), 'anonymous children get no role');

-- ---------------------------------------------------------------- teachers make classes

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', false);
insert into public.classes (name) values ('Class A');
select set_config('test.code_a', (select join_code from public.classes where name = 'Class A'), true);
select pg_temp.ok(current_setting('test.code_a') ~ '^[A-HJ-NP-Z2-9]{6}$', 'a join code is 6 characters with no 0/O/1/I');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2', false);
insert into public.classes (name) values ('Class B');
select set_config('test.code_b', (select join_code from public.classes where name = 'Class B'), true);
select pg_temp.ok((select count(*) from public.classes) = 1, 'a teacher cannot read another teacher''s class');
select pg_temp.fails($$ update public.classes set join_code = 'AAAAAA' $$, 'a teacher cannot set a join code by hand');
select set_config('test.class_b', (select id::text from public.classes), true);

-- ---------------------------------------------------------------- children join

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1', true);
select pg_temp.fails(format($$ select public.join_class('ZZZZZZ', 'Asha', 'young') $$), 'join_class rejects a wrong code');
select pg_temp.fails(format($$ select public.join_class(%L, 'Asha1', 'young') $$, current_setting('test.code_a')), 'join_class rejects a name with digits');
select pg_temp.fails(format($$ select public.join_class(%L, 'Asha', 'adult') $$, current_setting('test.code_a')), 'join_class rejects an unknown band');
select pg_temp.ok((select class_name from public.join_class(lower(current_setting('test.code_a')), '  Asha   Rani ', 'young')) = 'Class A',
  'join_class accepts a lower-case code and returns the class name');
select pg_temp.ok((select first_name from public.students) = 'Asha Rani', 'join_class tidies the name');
select pg_temp.ok((select count(*) from public.classes) = 1, 'a child sees only the class they joined');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2', true);
select public.join_class(current_setting('test.code_b'), 'आशा', 'teen');
select pg_temp.ok((select first_name from public.students) = 'आशा', 'a Hindi name with vowel signs is accepted');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', false);
select pg_temp.fails(format($$ select public.join_class(%L, 'Meena', 'young') $$, current_setting('test.code_a')), 'a teacher (email account) cannot join a class');

-- ---------------------------------------------------------------- children save progress

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1', true);
insert into public.progress (building_id, stars, best_score, completed) values ('school', 3, 100, true);
insert into public.progress (building_id, stars, best_score, completed) values ('school', 1, 40, false)
  on conflict (student_id, building_id) do update set stars = excluded.stars, best_score = excluded.best_score, completed = excluded.completed;
select pg_temp.ok((select stars = 3 and best_score = 100 and completed from public.progress), 'progress keeps the best result (max merge)');
insert into public.student_extras (student_id, cards) values (auth.uid(), '{right-to-education}')
  on conflict (student_id) do update set cards = excluded.cards;
update public.student_extras set cards = '{freedom-from-child-labour}', pledges = '{tell-adult}';
select pg_temp.ok((select cards from public.student_extras) = '{freedom-from-child-labour,right-to-education}', 'extras merge by union');
insert into public.quiz_attempts (building_id, question_id, correct) values ('school', 'age', true);
select pg_temp.fails($$ insert into public.progress (student_id, building_id, stars, best_score) values ('00000000-0000-0000-0000-0000000000c2', 'school', 3, 100) $$,
  'a child cannot write another child''s progress');
select pg_temp.fails($$ insert into public.classes (name) values ('My class') $$, 'a child cannot create a class');
select pg_temp.fails($$ select public.review_content('card:school:en', 'published') $$, 'a child cannot call reviewer RPCs');
select pg_temp.fails($$ select public.submit_content_for_review('card:school:en', 'card', 'en', repeat('a', 64)) $$, 'a child cannot submit content for review');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2', true);
insert into public.progress (building_id, stars, best_score, completed) values ('school', 2, 75, true);
select pg_temp.ok((select count(*) from public.progress) = 1, 'a child cannot read another child''s progress');
select pg_temp.ok((select count(*) from public.students) = 1, 'a child cannot read another child');
select pg_temp.ok((select count(*) from public.quiz_attempts) = 0, 'a child cannot read another child''s quiz attempts');
select pg_temp.fails($$ select public.rotate_join_code((select id from public.classes)) $$, 'a child cannot rotate a join code');

-- A classmate: the class mission counts everyone's stars, but each child still reads only their own.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c3', true);
select public.join_class(current_setting('test.code_b'), 'Ravi', 'young');
insert into public.progress (building_id, stars, best_score, completed) values ('school', 1, 50, true);
select pg_temp.ok((select total_stars from public.my_class_mission()) = 3, 'a child sees their class mission as the class total');
select pg_temp.ok((select class_name from public.my_class_mission()) = 'Class B', 'the class mission names the child''s own class');
select pg_temp.ok((select count(*) from public.progress) = 1, 'the class total never opens a classmate''s progress');

-- ---------------------------------------------------------------- teachers read their own class only

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', false);
select pg_temp.ok((select count(*) from public.students) = 1 and (select first_name from public.students) = 'Asha Rani', 'a teacher reads only their own students');
select pg_temp.ok((select count(*) from public.progress) = 1, 'a teacher reads only their own students'' progress');
select pg_temp.ok((select total_stars from public.class_mission) = 3, 'the class mission adds up the class''s stars');
select pg_temp.ok((select wrong from public.class_question_stats where question_id = 'age') = 0, 'question stats count first attempts');
select pg_temp.fails($$ select public.delete_class(current_setting('test.class_b')::uuid) $$, 'a teacher cannot delete another teacher''s class');
select pg_temp.ok(public.rotate_join_code((select id from public.classes)) <> current_setting('test.code_a'), 'a teacher can rotate their own join code');
delete from public.students; -- "remove student": only their own students are visible, so only they are removed

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2', false);
select pg_temp.ok((select count(*) from public.students) = 2, 'removing a student never touches another teacher''s class');
select pg_temp.ok(not exists (select 1 from public.my_class_mission()), 'a teacher has no child class mission');
select pg_temp.fails($$ select public.review_content('card:school:en', 'published') $$, 'a teacher cannot call reviewer RPCs');

-- ---------------------------------------------------------------- reviewers

reset role;
select pg_temp.act_as_admin();
update public.user_roles set role = 'reviewer' where user_id = '00000000-0000-0000-0000-0000000000a2';
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2', false);
select public.submit_content_for_review('card:school:en', 'card', 'en', repeat('a', 64));
select pg_temp.fails($$ select public.review_content('card:school:en', 'rejected') $$, 'a rejection needs a note');
select public.review_content('card:school:en', 'published');
select pg_temp.ok((select status from public.content_items) = 'published', 'a reviewer can publish');
select pg_temp.ok((select count(*) from public.content_events) = 2, 'every review step is logged');

-- ---------------------------------------------------------------- nobody without signing in

reset role;
select pg_temp.act_as_admin();
select set_config('role', 'anon', true);
select pg_temp.fails($$ select * from public.classes $$, 'signed-out visitors cannot read classes');
select pg_temp.fails($$ select * from public.class_mission $$, 'signed-out visitors cannot read the mission view');
select pg_temp.fails($$ select public.join_class('ZZZZZZ', 'Asha', 'young') $$, 'signed-out visitors cannot call join_class');
select pg_temp.fails($$ select * from public.my_class_mission() $$, 'signed-out visitors cannot read a class mission');

reset role;
select pg_temp.act_as_admin();
select 'RLS tests passed' as result;
rollback;
