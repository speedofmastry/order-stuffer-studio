CREATE TABLE public.shop_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'My Shop',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  footer TEXT NOT NULL DEFAULT 'Thank you!',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shop_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop settings" ON public.shop_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create shop settings" ON public.shop_settings FOR INSERT TO anon, authenticated WITH CHECK (id = 1);
CREATE POLICY "Anyone can update shop settings" ON public.shop_settings FOR UPDATE TO anon, authenticated USING (id = 1) WITH CHECK (id = 1);