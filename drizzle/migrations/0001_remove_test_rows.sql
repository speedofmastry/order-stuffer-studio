DELETE FROM public.invoice_items WHERE item_name = 'ZZTEST Coffee';
DELETE FROM public.invoices WHERE NOT EXISTS (SELECT 1 FROM public.invoice_items ii WHERE ii.invoice_id = invoices.id);
DELETE FROM public.items WHERE name = 'ZZTEST Coffee';