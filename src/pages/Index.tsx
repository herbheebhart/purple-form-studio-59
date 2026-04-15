import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';

const features = [
  { icon: Zap, title: 'Lightning Fast', description: 'Create beautiful forms in seconds with our intuitive builder.' },
  { icon: Shield, title: 'Secure & Private', description: 'Your data is encrypted and stored securely in the cloud.' },
  { icon: BarChart3, title: 'Smart Analytics', description: 'Get insights from responses with built-in analytics.' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <Header />

      {/* Hero */}
      <section className="container py-20 md:py-32 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-6">
          <Zap className="h-3.5 w-3.5" />
          Build forms effortlessly
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
          Create stunning forms in{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            minutes
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          The modern form builder for teams and individuals. Collect responses, analyze data, and share with anyone.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground border-0 text-base px-8 h-12">
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20 md:pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent mb-4">
                <f.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
