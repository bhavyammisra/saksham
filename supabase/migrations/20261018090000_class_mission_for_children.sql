-- The Class Mission for children (D-047).
-- A child may only read their own progress (D-043), so the class_mission view would show them
-- only their own stars. This function gives a child their class's mission as one total for the
-- whole class: never a number per child, and never anyone's name.

create function public.my_class_mission()
returns table (class_name text, mission_target integer, total_stars integer)
language sql stable security definer set search_path = '' as $$
  select c.name, c.mission_target, coalesce(sum(p.stars), 0)::integer
  from public.classes c
  left join public.students s on s.class_id = c.id
  left join public.progress p on p.student_id = s.id
  where c.id = (select private.my_class_id())
  group by c.id, c.name, c.mission_target
$$;

revoke all on function public.my_class_mission() from public, anon;
grant execute on function public.my_class_mission() to authenticated;
