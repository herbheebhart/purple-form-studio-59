-- Grant permissions on forms table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT ON public.forms TO anon;

-- Grant permissions on form_questions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_questions TO authenticated;
GRANT SELECT ON public.form_questions TO anon;

-- Grant permissions on form_responses table
GRANT SELECT, INSERT ON public.form_responses TO authenticated;
GRANT INSERT ON public.form_responses TO anon;

-- Grant permissions on response_answers table
GRANT SELECT, INSERT ON public.response_answers TO authenticated;
GRANT INSERT ON public.response_answers TO anon;