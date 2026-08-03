INSERT INTO public.platforms (id, user_id, name) VALUES
('47471878-7e6d-435c-a54c-e9811ed1c183','fd729c83-d228-44ed-aaaf-7dd6195362c2','Enplug'),
('e74bc38c-509f-47a8-8d4b-803f05ebc873','fd729c83-d228-44ed-aaaf-7dd6195362c2','EngageDSX'),
('3dc3fb99-2800-45da-a09a-c53d369a252d','fd729c83-d228-44ed-aaaf-7dd6195362c2','GRRID')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.devices (id, user_id, name, model, os, image_url, download_url, platform_id, created_at) VALUES
('4c8909aa-b1b1-4b79-969e-b174c4ec6a82','fd729c83-d228-44ed-aaaf-7dd6195362c2','NVIDIA Shield','Charlie','Android 8','/shield.png',NULL,'47471878-7e6d-435c-a54c-e9811ed1c183','2026-01-16T21:37:48.375675+00:00'),
('e557ba9c-191e-4c94-abf4-fed76826bfb4','fd729c83-d228-44ed-aaaf-7dd6195362c2','NVIDIA Shield','Taco','Android 9','/shield.png',NULL,'47471878-7e6d-435c-a54c-e9811ed1c183','2026-01-16T21:39:31.845858+00:00'),
('b3d4f957-f22f-4609-9307-ae2ee52ef4e6','fd729c83-d228-44ed-aaaf-7dd6195362c2','Series 10','newton','Android 9','/grrid-series10.png',NULL,'3dc3fb99-2800-45da-a09a-c53d369a252d','2026-01-16T18:34:33.039701+00:00'),
('db242f98-46ee-4816-97c0-aacfcc1ce899','fd729c83-d228-44ed-aaaf-7dd6195362c2','Series 9','Something','Android','/grrid-series9.png',NULL,'3dc3fb99-2800-45da-a09a-c53d369a252d','2026-01-16T22:04:28.393023+00:00'),
('a90fd29d-7a83-4eaf-8411-6229b9b3ec44','fd729c83-d228-44ed-aaaf-7dd6195362c2','Nano','N3350','Linux','/nano.png',NULL,'e74bc38c-509f-47a8-8d4b-803f05ebc873','2026-01-16T22:19:31.832034+00:00'),
('6194e3a2-224e-4a51-b398-aa0f67d96054','fd729c83-d228-44ed-aaaf-7dd6195362c2','Nano','N3350','Windows','/nano.png',NULL,'e74bc38c-509f-47a8-8d4b-803f05ebc873','2026-01-16T22:20:31.526787+00:00'),
('b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','fd729c83-d228-44ed-aaaf-7dd6195362c2','NVIDIA Shield','Tarator','Android 11','/shield.png',NULL,'47471878-7e6d-435c-a54c-e9811ed1c183','2026-01-16T18:19:49.138489+00:00'),
('58cc0979-1b1b-442b-918f-7a523fc653b2','fd729c83-d228-44ed-aaaf-7dd6195362c2','Brightsign','XT','OS: 8.5.64','/brightsign.jpg','/autorun.zip','47471878-7e6d-435c-a54c-e9811ed1c183','2026-01-16T18:32:30.361953+00:00'),
('d2e0159d-288a-4638-be29-355fdbf91d4a','fd729c83-d228-44ed-aaaf-7dd6195362c2','Giada','DN74','Android 11 giada-jhs558','/giada-dn74.png',NULL,'47471878-7e6d-435c-a54c-e9811ed1c183','2026-01-16T18:15:32.341895+00:00'),
('99088bf9-d69b-4d52-ba27-d84fdc2ff36b','fd729c83-d228-44ed-aaaf-7dd6195362c2','S905x3','newton','Android 9','/grrid-series10.png',NULL,'e74bc38c-509f-47a8-8d4b-803f05ebc873','2026-07-03T19:23:00.350564+00:00'),
('45272294-d069-447a-ba21-7a381374b037','fd729c83-d228-44ed-aaaf-7dd6195362c2','NVIDIA Shield','Tarator','Android 11','/shield.png',NULL,'e74bc38c-509f-47a8-8d4b-803f05ebc873','2026-07-03T19:22:12.094976+00:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.software_versions (id, device_id, name, version) VALUES
('77e7aa23-d5b8-4524-bf68-adb8412a63ab','99088bf9-d69b-4d52-ba27-d84fdc2ff36b','Player','8.0.9'),('033750f8-e010-4db3-aff9-e91146ea35c8','45272294-d069-447a-ba21-7a381374b037','Player','8.0.9'),('7e49e231-a86c-403c-a1b8-9f2317f1c477','45272294-d069-447a-ba21-7a381374b037','WebView','127.0.6533.143'),('02669a22-b474-439f-a565-27854e43cbb2','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','Player','809'),('28f9d332-fc33-4940-aa4a-31ad98aa64d1','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','EDU Command','109'),('0c0b4645-efb5-4076-8464-abb11eae23c6','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','EDU Watcher','17'),('04fc9df7-c0a2-4b77-a2e0-24c72744a803','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','EDU Updater','62'),('9991b464-bdf5-48ce-8490-6de3f2efeb4f','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','Log Writer','16'),('3d35e87e-0ef7-458a-85c3-87ff6ea058e1','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','Command Receiver','100'),('a0cbb2f0-c6f0-4407-9e7d-8c7fa107b953','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','Tv Controller','51'),('976532b7-4bf4-411a-92f2-27e31fe62e8c','4c8909aa-b1b1-4b79-969e-b174c4ec6a82','WebView','127.0.6533.143'),('16ae39a2-b416-44cf-9d6b-94c819f2d4c2','e557ba9c-191e-4c94-abf4-fed76826bfb4','Player','809'),('a4b4621f-f337-4218-9477-1c94b36b898c','e557ba9c-191e-4c94-abf4-fed76826bfb4','EDU Command','109'),('06a7377f-ed54-408a-8bee-dd1071851bfd','e557ba9c-191e-4c94-abf4-fed76826bfb4','EDU Watcher','17'),('29c464b5-74f7-4911-8472-ce969787013c','e557ba9c-191e-4c94-abf4-fed76826bfb4','EDU Updater','62'),('90cca337-da8b-45c5-926c-6f432155af1a','e557ba9c-191e-4c94-abf4-fed76826bfb4','Log Writer','16'),('5909a7e6-09b6-4e33-93b8-309b3284b7bf','e557ba9c-191e-4c94-abf4-fed76826bfb4','Command Receiver','100'),('755346c2-4e48-4a60-b28e-4ac147f49da7','e557ba9c-191e-4c94-abf4-fed76826bfb4','Tv Controller','51'),('a6e6057e-6454-4775-8221-1e70316dbe49','e557ba9c-191e-4c94-abf4-fed76826bfb4','WebView','127.0.6533.143'),('be1309b9-fd9b-47b7-be48-559622df23db','b3d4f957-f22f-4609-9307-ae2ee52ef4e6','Player','2.0.5.54'),('9bb02e0d-56a4-464b-a8cf-1236af6187e3','db242f98-46ee-4816-97c0-aacfcc1ce899','Player','0'),('8a6e9bd0-3877-42e3-8179-ced5ec93e45b','a90fd29d-7a83-4eaf-8411-6229b9b3ec44','Player','0.9.5'),('f5c0bff6-a221-4069-a5a7-b53cf12501e4','6194e3a2-224e-4a51-b398-aa0f67d96054','Player','0.5.15'),('7762b682-2a3f-40e3-a7b9-a5bae04d3e19','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','Player','7061'),('cbf652a2-d70b-4543-9ae2-ae7ee1a03f3f','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','EDU Command','1015'),('93f92b22-2f74-48da-90c7-d389960adeba','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','EDU Watcher','1081'),('40e5115c-cdb2-4d22-acac-e3efeac8c1e0','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','EDU Updater','6108'),('bf49ce84-5034-44ba-9334-fc125c9dc557','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','Log Writer','1061'),('6b6b4a66-0890-472e-8d35-15d753cb9986','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','Command Receiver','9078'),('a40e37ae-fe76-40db-8ab1-8ca552464ca5','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','Tv Controller','51'),('cadbe398-80ab-4613-bec7-0829cc00e716','b4c8cfdf-8e38-47f6-bd29-17dd7ceceb2f','WebView','127.0.6533.143'),('3e2048ec-55b5-4469-9ac5-d391642f3367','58cc0979-1b1b-442b-918f-7a523fc653b2','Supported Devices','XT1143'),('910614d9-e66b-4672-86aa-13c1008916a0','58cc0979-1b1b-442b-918f-7a523fc653b2','Supported Devices','XT1144'),('854fbaeb-8222-4b92-860f-6405c5e6b186','58cc0979-1b1b-442b-918f-7a523fc653b2','Supported Devices','XT243'),('ffebe90e-4143-4c85-b861-0b80991c1609','58cc0979-1b1b-442b-918f-7a523fc653b2','Supported Devices','XT244'),('3b781e32-2cf5-48f2-9f84-320be79ed3d9','58cc0979-1b1b-442b-918f-7a523fc653b2','Autorun Version','.27.4'),('92f10e79-a578-4321-bff6-158f32a4222a','d2e0159d-288a-4638-be29-355fdbf91d4a','Player','7061'),('8edc579f-4cbe-40c2-9c3e-c2cb23987e2f','d2e0159d-288a-4638-be29-355fdbf91d4a','EDU Command','1015'),('3f8dad33-5245-4083-a54c-f494d6090d28','d2e0159d-288a-4638-be29-355fdbf91d4a','EDU Watcher','1081'),('6b5d7a3a-2de1-469f-a824-7dc573307bf9','d2e0159d-288a-4638-be29-355fdbf91d4a','EDU Updater','6108'),('afb9cfb7-57de-42b7-8788-86ba3fa505bd','d2e0159d-288a-4638-be29-355fdbf91d4a','Log Writer','1062'),('4641fc33-c631-442f-92f5-3caae3fea346','d2e0159d-288a-4638-be29-355fdbf91d4a','Command Receiver','9078'),('39bd99b7-fd52-414a-8240-32da37ee9acf','d2e0159d-288a-4638-be29-355fdbf91d4a','Tv Controller','51'),('556fe7fd-8757-49bd-8251-be0f9f3926ae','d2e0159d-288a-4638-be29-355fdbf91d4a','Webview','127.0.6533.143')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.uptime_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  status_page_slug TEXT NOT NULL DEFAULT 'default',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX uptime_sites_user_idx ON public.uptime_sites (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uptime_sites TO authenticated;
GRANT ALL ON public.uptime_sites TO service_role;
ALTER TABLE public.uptime_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own uptime sites" ON public.uptime_sites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_uptime_sites_updated_at BEFORE UPDATE ON public.uptime_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();