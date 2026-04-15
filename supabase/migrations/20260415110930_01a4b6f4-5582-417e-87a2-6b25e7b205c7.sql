
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Form',
  description TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.form_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL DEFAULT '',
  question_type TEXT NOT NULL DEFAULT 'short_answer',
  options JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.response_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  answer_value TEXT DEFAULT ''
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own forms" ON public.forms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create forms" ON public.forms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own forms" ON public.forms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own forms" ON public.forms FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Published forms are public" ON public.forms FOR SELECT USING (is_published = true);

CREATE POLICY "Form owner can manage questions" ON public.form_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.forms WHERE forms.id = form_questions.form_id AND forms.user_id = auth.uid())
);
CREATE POLICY "Public can read questions of published forms" ON public.form_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.forms WHERE forms.id = form_questions.form_id AND forms.is_published = true)
);

CREATE POLICY "Anyone can submit responses to published forms" ON public.form_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.forms WHERE forms.id = form_responses.form_id AND forms.is_published = true)
);
CREATE POLICY "Form owner can view responses" ON public.form_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.forms WHERE forms.id = form_responses.form_id AND forms.user_id = auth.uid())
);

CREATE POLICY "Anyone can submit answers" ON public.response_answers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.form_responses r
    JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = response_answers.response_id AND f.is_published = true
  )
);
CREATE POLICY "Form owner can view answers" ON public.response_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.form_responses r
    JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = response_answers.response_id AND f.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_form_questions_form_id ON public.form_questions(form_id);
CREATE INDEX idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX idx_response_answers_response_id ON public.response_answers(response_id);
