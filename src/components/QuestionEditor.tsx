import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical, Plus, X } from 'lucide-react';
import type { Question, QuestionType } from '@/lib/types';

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
];

interface Props {
  question: Question;
  onChange: (q: Question) => void;
  onDelete: () => void;
}

export default function QuestionEditor({ question, onChange, onDelete }: Props) {
  const hasOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(question.question_type);

  const updateOption = (index: number, value: string) => {
    const opts = [...question.options];
    opts[index] = value;
    onChange({ ...question, options: opts });
  };

  const addOption = () => {
    onChange({ ...question, options: [...question.options, `Option ${question.options.length + 1}`] });
  };

  const removeOption = (index: number) => {
    onChange({ ...question, options: question.options.filter((_, i) => i !== index) });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
      <div className="flex items-start gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={question.question_text}
              onChange={(e) => onChange({ ...question, question_text: e.target.value })}
              placeholder="Question text"
              className="flex-1 font-medium"
            />
            <Select
              value={question.question_type}
              onValueChange={(v) => onChange({ ...question, question_type: v as QuestionType, options: ['multiple_choice', 'checkboxes', 'dropdown'].includes(v) && question.options.length === 0 ? ['Option 1'] : question.options })}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasOptions && (
            <div className="space-y-2 pl-1">
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} className="flex-1" />
                  {question.options.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(i)} className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addOption} className="text-primary">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add option
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch
                checked={question.is_required}
                onCheckedChange={(v) => onChange({ ...question, is_required: v })}
                id={`req-${question.id}`}
              />
              <Label htmlFor={`req-${question.id}`} className="text-sm text-muted-foreground">Required</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
