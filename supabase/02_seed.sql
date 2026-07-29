-- ============================================================================
--  3x3 ALBANIA — seed data (11th edition, Shkoder)
--  Run AFTER 01_schema.sql. Re-running refreshes the rosters without
--  touching groups, matches or results.
-- ============================================================================

insert into divisions (id, name_sq, name_en, sort_order) values
  ('u18',   'Turneu U18',      'U18 Tournament',     1),
  ('women', 'Turneu i Femrave', 'Women''s Tournament', 2)
on conflict (id) do update
  set name_sq = excluded.name_sq,
      name_en = excluded.name_en,
      sort_order = excluded.sort_order;

-- Upsert a team together with its roster.
create or replace function _seed_team(p_div text, p_name text, p_sort int, p_players text[])
returns void language plpgsql as $$
declare
  v_team uuid;
  i      int;
begin
  insert into teams (division_id, name, sort_order)
    values (p_div, p_name, p_sort)
    on conflict (division_id, name) do update set sort_order = excluded.sort_order
    returning id into v_team;

  delete from players where team_id = v_team;

  for i in 1 .. coalesce(array_length(p_players, 1), 0) loop
    insert into players (team_id, name, sort_order) values (v_team, p_players[i], i);
  end loop;
end $$;

-- ------------------------------------------------------------- U18 (14 teams)
select _seed_team('u18', 'Avengers', 1,
  array['Edrion Kuci', 'Samuel Bazhdari', 'Devis Hila', 'Erdis Alushi']);
select _seed_team('u18', 'Galaktiking', 2,
  array['Mikel Beqaraj', 'Genti Nilo', 'Aron Qyrfyca', 'Arvi Leskoviku']);
select _seed_team('u18', 'Shkodra Warriors', 3,
  array['Aldion Dibra', 'Besard Dibra', 'Ajet Lohja', 'Dario Gjonej']);
select _seed_team('u18', 'Black Eagles', 4,
  array['Erisild Cafej', 'Ivan Gurashi', 'Gerid Kraja', 'Geron Sekniqi']);
select _seed_team('u18', 'Brick-d Up', 5,
  array['Jear Cocja', 'Sidrit Muja', 'Roan Smakaj', 'Manuel Ndoja']);
select _seed_team('u18', 'Drizzy-Yeezy', 6,
  array['Regis Molla', 'Ergi Ujkaj', 'Iven Lufi', 'Rajan Molla']);
select _seed_team('u18', 'LLB', 7,
  array['Luis Koci', 'Aleks Kote', 'Matias Mucaj']);
select _seed_team('u18', 'Old Heads', 8,
  array['Rejan Lumanaj', 'Klevi Katana', 'Raili Bajama', 'Islail Shabaj']);
select _seed_team('u18', 'Takeover', 9,
  array['Erlis Hoti', 'Rijad Cela', 'Agelo Collaku', 'Eiden Magilaj']);
select _seed_team('u18', 'Triple Threat', 10,
  array['Anuar Hoti', 'Arsild Mbiarra', 'Jozef Zefi', 'Mikel Matija']);
select _seed_team('u18', 'Killer Bucket', 11,
  array['Helgis Bregu', 'Deion Lekaj', 'Devis Zefi', 'Leon Hotaj']);
select _seed_team('u18', 'Nightmare', 12,
  array['Marios Prendi', 'Jerdi Preka', 'Dean Shkreli', 'Theoxaris Sotiris']);
select _seed_team('u18', 'The Winners', 13,
  array['Joanes Preka', 'Keiron Jashari', 'Dion Suma', 'Bleron Kodra']);
select _seed_team('u18', 'Next Gen', 14,
  array['Embri Gjokaj', 'Mateo Palumbo', 'Engin Hoxha', 'Blersjor Lisen']);

-- ---------------------------------------------------------- WOMEN (6 teams)
select _seed_team('women', 'Lasito', 1,
  array['Yllza Uka', 'Elda Mulhaxha', 'Elsa Shala']);
select _seed_team('women', 'Toea Squad', 2,
  array['Enisa Qosja', 'Ornela Lalaj', 'Tea Jace', 'Anja Kasa']);
select _seed_team('women', 'Triple Squad', 3,
  array['Reisa Trashani', 'Medina Hykaj', 'Melida Hykaj', 'Isra Dibra']);
select _seed_team('women', 'Visto', 4,
  array['Aurora Dhedhes', 'Lorinda Zhupi', 'Jurila Sena', 'Fitnete Qoku']);
select _seed_team('women', 'Hoopers', 5,
  array['Anisa Musaja', 'Anisa Bokrina', 'Sara Murcaj']);
select _seed_team('women', 'Stars Power', 6,
  array['Jessica Rios', 'Bernarda Rreshpja', 'Ingrit Dashja (Kraja)', 'Medina Mustafa']);

drop function _seed_team(text, text, int, text[]);

-- Sanity check
select d.id, count(distinct t.id) as teams, count(p.id) as players
from divisions d
left join teams t on t.division_id = d.id
left join players p on p.team_id = t.id
group by d.id order by d.id;
