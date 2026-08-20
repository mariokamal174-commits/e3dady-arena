insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "avatars read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "avatars insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'avatars');

create policy "avatars update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

create policy "avatars delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'avatars');
