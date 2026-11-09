# Meme Lab

- Keep seven separate HTML entry points in Vite. Use ES modules, Bootstrap 5 and plain JavaScript.
- Keep Bulgarian UI text with correct Cyrillic spelling. Test on narrow and wide viewports.
- Put shared UI in `src/ui`, page controllers in `src/pages`, Supabase operations in `src/services`.
- Keep guest creation and PNG export working without a Supabase connection.
- Keep service keys out of browser code, logs, build artifacts and tracked files.
- Apply schema changes through new ordered Supabase migrations. Verify RLS as anon, owner, unrelated user and admin.
- Store source photos in a private bucket. Gallery access is limited to rendered PNGs for visible public records.
- Treat titles and captions as untrusted text. Use textContent and Canvas, and keep privileged operations protected by SQL.
- Run npm test and npm run build before committing. Use small commits for completed changes.
