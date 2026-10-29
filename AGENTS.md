<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture
- App data (items, invoices, invoice_items) lives in Lovable Cloud and is read/written from the browser via the generated client in src/lib/receipt-store.ts; the app has no sign-in, so tables use open RLS policies matching the original project.
- Shop header settings stay in device localStorage; they are per-device preferences, not shared data.
- Share language state through a root LanguageProvider (src/lib/language.tsx), persisting the choice on the device, so pages and receipts stay consistent.
- Render receipt barcodes as vector bars from JsBarcode Code 128 (src/lib/receipt-barcode.ts); this keeps scanner-readable geometry on thermal paper and works during SSR.
