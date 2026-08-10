-- 1. Admin-only writes on the shared device catalog
DROP POLICY IF EXISTS "Authenticated users insert platforms" ON public.platforms;
DROP POLICY IF EXISTS "Authenticated users update platforms" ON public.platforms;
DROP POLICY IF EXISTS "Authenticated users delete platforms" ON public.platforms;
DROP POLICY IF EXISTS "Authenticated users insert devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users update devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users delete devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users insert software versions" ON public.software_versions;
DROP POLICY IF EXISTS "Authenticated users update software versions" ON public.software_versions;
DROP POLICY IF EXISTS "Authenticated users delete software versions" ON public.software_versions;

CREATE POLICY "Admins insert platforms" ON public.platforms
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update platforms" ON public.platforms
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete platforms" ON public.platforms
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins insert devices" ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update devices" ON public.devices
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete devices" ON public.devices
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins insert software versions" ON public.software_versions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update software versions" ON public.software_versions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete software versions" ON public.software_versions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 2. Workspace-wide module toggles, admin controlled
CREATE TABLE public.workspace_modules (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_modules TO authenticated;
GRANT ALL ON public.workspace_modules TO service_role;

ALTER TABLE public.workspace_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read workspace modules" ON public.workspace_modules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert workspace modules" ON public.workspace_modules
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update workspace modules" ON public.workspace_modules
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete workspace modules" ON public.workspace_modules
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER update_workspace_modules_updated_at
  BEFORE UPDATE ON public.workspace_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.workspace_modules (key, enabled) VALUES
  ('cases', true),
  ('devices', true),
  ('uptime', true),
  ('dashy', true),
  ('brand', false),
  ('roi', false);