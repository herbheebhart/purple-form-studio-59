import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, FileText } from 'lucide-react';
import type { Question } from '@/lib/types';

export default function FormRespond() {
  const { id } = useParams();
  const { toast } = useToast();
  const [form, setForm] = useState<{ title: string; description: string | null } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkboxAnswers, setCheckboxAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    const { data: formData } = await supabase.from('forms').select('*').eq('id', id!).eq('is_published', true).single();
    if (!formData) {
      setLoading(false);
      return;
    }
    setForm({ title: formData.title, description: formData.description });

    const { data: qs } = await supabase.from('form_questions').select('*').eq('form_id', id!).order('sort_order');
    if (qs) {
      setQuestions(qs.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type as Question['question_type'],
        options: (q.options as string[]) || [],
        is_required: q.is_required,
        sort_order: q.sort_order,
      })));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required
    for (const q of questions) {
      if (q.is_required) {
        if (q.question_type === 'checkboxes') {
          if (!checkboxAnswers[q.id] || checkboxAnswers[q.id].length === 0) {
            toast({ title: 'Required', description: `Please answer: ${q.question_text}`, variant: 'destructive' });
            return;
          }
        } else if (!answers[q.id]?.trim()) {
          toast({ title: 'Required', description: `Please answer: ${q.question_text}`, variant: 'destructive' });
          return;
        }
      }
    }

    setSubmitting(true);

    const { data: response } = await supabase.from('form_responses').insert({ form_id: id! }).select().single();

    if (response) {
      const answerRows = questions.map((q) => ({
        response_id: response.id,
        question_id: q.id,
        answer_value: q.question_type === 'checkboxes'
          ? (checkboxAnswers[q.id] || []).join(', ')
          : (answers[q.id] || ''),
      }));

      await supabase.from('response_answers').insert(answerRows);
      setSubmitted(true);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Form not found</p>
          <p className="text-muted-foreground">This form may not exist or isn't published.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Response submitted!</h2>
          <p className="text-muted-foreground">Thank you for filling out this form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-2xl py-10 animate-fade-in">
        {/* Header with branding */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-primary">
            <FileText className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">QuickForm Pro</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
          <div className="h-2 rounded-t-xl gradient-primary -mx-6 -mt-6 mb-6" />
          <h1 className="text-2xl font-bold text-foreground">{form.title}</h1>
          {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <Label className="text-base font-medium text-foreground">
                {q.question_text}
                {q.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>

              <div className="mt-3">
                {q.question_type === 'short_answer' && (
                  <Input
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Your answer"
                  />
                )}

                {q.question_type === 'paragraph' && (
                  <Textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Your answer"
                    rows={4}
                  />
                )}

                {q.question_type === 'multiple_choice' && (
                  <RadioGroup value={answers[q.id] || ''} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                        <Label htmlFor={`${q.id}-${i}`} className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.question_type === 'checkboxes' && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox
                          id={`${q.id}-${i}`}
                          checked={(checkboxAnswers[q.id] || []).includes(opt)}
                          onCheckedChange={(checked) => {
                            const current = checkboxAnswers[q.id] || [];
                            setCheckboxAnswers({
                              ...checkboxAnswers,
                              [q.id]: checked ? [...current, opt] : current.filter((v) => v !== opt),
                            });
                          }}
                        />
                        <Label htmlFor={`${q.id}-${i}`} className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                )}

                {q.question_type === 'dropdown' && (
                  <Select value={answers[q.id] || ''} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map((opt, i) => (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}

          <Button type="submit" className="gradient-primary text-primary-foreground border-0 px-8" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </div>
    </div>
  );
}
