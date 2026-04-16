-- Re-grant to force schema cache invalidation
REVOKE ALL ON public.form_responses FROM anon;
REVOKE ALL ON public.response_answers FROM anon;

GRANT SELECT ON public.forms TO anon;
GRANT SELECT ON public.form_questions TO anon;
GRANT INSERT, SELECT ON public.form_responses TO anon;
GRANT INSERT, SELECT ON public.response_answers TO anon;

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';