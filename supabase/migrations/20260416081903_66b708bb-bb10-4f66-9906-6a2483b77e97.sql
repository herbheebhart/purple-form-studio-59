-- Force PostgREST to notice schema changes
COMMENT ON TABLE public.form_responses IS 'Stores form submission responses';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';