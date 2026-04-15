import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import QuestionEditor from '@/components/QuestionEditor';
import { Plus, Save, Globe, Eye, Copy } from 'lucide-react';
import type { Question } from '@/lib/types';

export default function FormBuilder() {
  const { id } = useParams();
  const isNew = id === 'new';
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('Untitled Form');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [formId, setFormId] = useState<string | null>(isNew ? null : id!);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (!isNew && id && user) loadForm();
  }, [id, user]);

  const loadForm = async () => {
    const { data: form } = await supabase.from('forms').select('*').eq('id', id!).single();
    if (form) {
      setTitle(form.title);
      setDescription(form.description || '');
      setIsPublished(form.is_published);
      setFormId(form.id);

      const { data: qs } = await supabase.from('form_questions').select('*').eq('form_id', form.id).order('sort_order');
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
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'short_answer',
      options: [],
      is_required: false,
      sort_order: questions.length,
    }]);
  };

  const updateQuestion = (index: number, q: Question) => {
    const updated = [...questions];
    updated[index] = q;
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const save = async (publish?: boolean) => {
    if (!user) return;
    setSaving(true);

    try {
      let currentFormId = formId;

      if (!currentFormId) {
        const { data, error } = await supabase.from('forms').insert({
          user_id: user.id,
          title,
          description,
          is_published: publish ?? false,
        }).select().single();

        if (error) throw error;
        currentFormId = data.id;
        setFormId(data.id);
      } else {
        await supabase.from('forms').update({
          title,
          description,
          is_published: publish !== undefined ? publish : isPublished,
        }).eq('id', currentFormId);
      }

      if (publish !== undefined) setIsPublished(publish);

      // Delete existing questions and re-insert
      await supabase.from('form_questions').delete().eq('form_id', currentFormId);

      if (questions.length > 0) {
        await supabase.from('form_questions').insert(
          questions.map((q, i) => ({
            form_id: currentFormId!,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options as any,
            is_required: q.is_required,
            sort_order: i,
          }))
        );
      }

      toast({ title: publish ? 'Form published!' : 'Form saved!' });

      if (isNew && currentFormId) {
        navigate(`/form/${currentFormId}`, { replace: true });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }

    setSaving(false);
  };

  const copyLink = () => {
    if (formId) {
      navigator.clipboard.writeText(`${window.location.origin}/form/${formId}/respond`);
      toast({ title: 'Link copied!' });
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen gradient-hero">
      <Header />
      <div className="container max-w-3xl py-8 animate-fade-in">
        {/* Form Header */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
          <div className="h-2 rounded-t-xl gradient-primary -mx-6 -mt-6 mb-6" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 mb-3"
            placeholder="Form title"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Form description (optional)"
            className="border-0 px-0 resize-none focus-visible:ring-0 text-muted-foreground"
            rows={2}
          />
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              onChange={(updated) => updateQuestion(i, updated)}
              onDelete={() => deleteQuestion(i)}
            />
          ))}
        </div>

        <Button variant="outline" onClick={addQuestion} className="w-full border-dashed mb-8">
          <Plus className="h-4 w-4 mr-2" /> Add Question
        </Button>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4">
          <Button onClick={() => save()} disabled={saving} variant="outline" className="flex-1">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={() => save(true)} disabled={saving} className="flex-1 gradient-primary text-primary-foreground border-0">
            <Globe className="h-4 w-4 mr-2" /> {saving ? 'Publishing...' : 'Publish'}
          </Button>
          {formId && isPublished && (
            <Button variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" /> Copy Link
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
