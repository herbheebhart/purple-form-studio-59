-- Create a security definer function to check if form is published
-- This bypasses RLS on the forms table when checking from within another policy
CREATE OR REPLACE FUNCTION public.is_form_published(form_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forms
    WHERE id = form_id AND is_published = true
  );
$$;

-- Drop and recreate INSERT policy on form_responses
DROP POLICY IF EXISTS "Anyone can submit responses to published forms" ON public.form_responses;
CREATE POLICY "Anyone can submit responses to published forms"
ON public.form_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_form_published(form_id));

-- Drop and recreate INSERT policy on response_answers  
DROP POLICY IF EXISTS "Anyone can submit answers" ON public.response_answers;
CREATE POLICY "Anyone can submit answers"
ON public.response_answers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.form_responses r
    WHERE r.id = response_answers.response_id
  )
);