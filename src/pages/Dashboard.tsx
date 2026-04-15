import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Plus, Copy, Trash2, Edit, BarChart3, ExternalLink } from 'lucide-react';
import type { Form } from '@/lib/types';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchForms();
  }, [user]);

  const fetchForms = async () => {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });
    setForms((data as Form[]) || []);
    setLoading(false);
  };

  const duplicateForm = async (form: Form) => {
    const { data: newForm } = await supabase
      .from('forms')
      .insert({ user_id: user!.id, title: `${form.title} (Copy)`, description: form.description })
      .select()
      .single();

    if (newForm) {
      const { data: questions } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', form.id);

      if (questions && questions.length > 0) {
        await supabase.from('form_questions').insert(
          questions.map((q) => ({
            form_id: newForm.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            is_required: q.is_required,
            sort_order: q.sort_order,
          }))
        );
      }
      toast({ title: 'Form duplicated!' });
      fetchForms();
    }
  };

  const deleteForm = async (id: string) => {
    await supabase.from('forms').delete().eq('id', id);
    setForms(forms.filter((f) => f.id !== id));
    toast({ title: 'Form deleted' });
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${id}/respond`);
    toast({ title: 'Link copied!' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero">
        <Header />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Header />
      <div className="container py-10 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Forms</h1>
            <p className="text-sm text-muted-foreground">{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => navigate('/form/new')} className="gradient-primary text-primary-foreground border-0">
            <Plus className="h-4 w-4 mr-2" /> New Form
          </Button>
        </div>

        {forms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No forms yet. Create your first one!</p>
            <Button onClick={() => navigate('/form/new')} className="gradient-primary text-primary-foreground border-0">
              <Plus className="h-4 w-4 mr-2" /> Create Form
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div key={form.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{form.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(form.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.is_published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {form.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{form.description || 'No description'}</p>
                <div className="flex gap-1 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/form/${form.id}`)}>
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/form/${form.id}/responses`)}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1" /> Responses
                  </Button>
                  {form.is_published && (
                    <Button variant="ghost" size="sm" onClick={() => copyLink(form.id)}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Link
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => duplicateForm(form)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteForm(form.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
