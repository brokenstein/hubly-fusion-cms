-- 1) Remove anonymous access to shared ROI deals
DROP POLICY IF EXISTS "Shared roi deals are publicly viewable" ON public.roi_deals;
REVOKE SELECT ON public.roi_deals FROM anon;

-- 2) Stop exposing has_role() to API roles
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;