CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read items" ON public.items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add items" ON public.items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update items" ON public.items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete items" ON public.items FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.invoices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read invoices" ON public.invoices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add invoices" ON public.invoices FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT ON public.invoice_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read invoice items" ON public.invoice_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add invoice items" ON public.invoice_items FOR INSERT TO anon, authenticated WITH CHECK (true);