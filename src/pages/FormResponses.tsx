import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ResponseData {
  id: string;
  submitted_at: string;
  answers: { question_text: string; answer_value: string }[];
}

export default function FormResponses() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formTitle, setFormTitle] = useState('');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [questions, setQuestions] = useState<{ id: string; question_text: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (user && id) loadData();
  }, [user, id]);

  const loadData = async () => {
    const { data: form } = await supabase.from('forms').select('title').eq('id', id!).single();
    if (form) setFormTitle(form.title);

    const { data: qs } = await supabase.from('form_questions').select('id, question_text').eq('form_id', id!).order('sort_order');
    const questionList = qs || [];
    setQuestions(questionList);

    const { data: resps } = await supabase.from('form_responses').select('id, submitted_at').eq('form_id', id!).order('submitted_at', { ascending: false });

    if (resps && resps.length > 0) {
      const { data: allAnswers } = await supabase.from('response_answers').select('response_id, question_id, answer_value').in('response_id', resps.map((r) => r.id));

      const mapped = resps.map((r) => ({
        id: r.id,
        submitted_at: r.submitted_at,
        answers: questionList.map((q) => ({
          question_text: q.question_text,
          answer_value: allAnswers?.find((a) => a.response_id === r.id && a.question_id === q.id)?.answer_value || '',
        })),
      }));
      setResponses(mapped);
    }

    setLoading(false);
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
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{formTitle}</h1>
            <p className="text-sm text-muted-foreground">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No responses yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary cards */}
            {questions.map((q) => {
              const allAnswers = responses.map((r) => r.answers.find((a) => a.question_text === q.question_text)?.answer_value || '').filter(Boolean);
              const counts: Record<string, number> = {};
              allAnswers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });

              return (
                <div key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <h3 className="font-semibold text-foreground mb-3">{q.question_text}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{allAnswers.length} response{allAnswers.length !== 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([value, count]) => (
                      <div key={value} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground truncate">{value}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-primary transition-all"
                              style={{ width: `${(count / allAnswers.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Individual responses */}
            <h2 className="text-lg font-semibold text-foreground pt-4">Individual Responses</h2>
            {responses.map((r, i) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-xs text-muted-foreground mb-3">
                  Response #{responses.length - i} · {new Date(r.submitted_at).toLocaleString()}
                </p>
                <div className="space-y-3">
                  {r.answers.map((a, j) => (
                    <div key={j}>
                      <p className="text-sm font-medium text-foreground">{a.question_text}</p>
                      <p className="text-sm text-muted-foreground">{a.answer_value || '(empty)'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
