CREATE POLICY "Authenticated read device assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'device-assets');

CREATE POLICY "Admins upload device assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'device-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins update device assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'device-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (bucket_id = 'device-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins delete device assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'device-assets' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));