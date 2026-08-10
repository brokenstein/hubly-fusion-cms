-- Shared device catalog: every authenticated user sees and manages the same devices
DROP POLICY IF EXISTS "Users manage own platforms" ON public.platforms;
DROP POLICY IF EXISTS "Users manage own devices" ON public.devices;
DROP POLICY IF EXISTS "Users manage versions of own devices" ON public.software_versions;

CREATE POLICY "Authenticated users read all platforms" ON public.platforms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users insert platforms" ON public.platforms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users update platforms" ON public.platforms
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users delete platforms" ON public.platforms
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users read all devices" ON public.devices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users insert devices" ON public.devices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users update devices" ON public.devices
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users delete devices" ON public.devices
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users read all software versions" ON public.software_versions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users insert software versions" ON public.software_versions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users update software versions" ON public.software_versions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users delete software versions" ON public.software_versions
  FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platforms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.software_versions TO authenticated;
GRANT ALL ON public.platforms TO service_role;
GRANT ALL ON public.devices TO service_role;
GRANT ALL ON public.software_versions TO service_role;