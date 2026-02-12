import { Link } from 'react-router-dom';
import { BookOpen, Languages, Volume2, Cloud, Smartphone, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Landing() {
  const features = [
    {
      icon: BookOpen,
      title: 'Reader Modern',
      description: 'Importă cărți EPUB și PDF, citește cu mod zi/noapte și setări personalizabile.',
    },
    {
      icon: Languages,
      title: 'Traducere Instantă',
      description: 'Atinge orice cuvânt pentru traducere imediată și context.',
    },
    {
      icon: Volume2,
      title: 'Pronunție Audio',
      description: 'Ascultă pronunția corectă a cuvintelor și frazelor.',
    },
    {
      icon: GraduationCap,
      title: 'Vocabular Personal',
      description: 'Salvează și organizează cuvintele noi pentru recapitulare.',
    },
    {
      icon: Cloud,
      title: 'Sincronizare Cloud',
      description: 'Toate datele sincronizate pe toate dispozitivele tale.',
    },
    {
      icon: Smartphone,
      title: 'Oriunde, Oricând',
      description: 'Funcționează pe telefon, tabletă și desktop, chiar și offline.',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative px-4 pb-20 pt-24 md:pt-32">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Învață limbi străine citind
              </div>
              
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Transformă{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  lectura
                </span>{' '}
                în învățare
              </h1>
              
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Citește cărți în limba pe care vrei să o înveți. Atinge orice cuvânt pentru traducere 
                instantă, salvează vocabular și exersează cu flashcard-uri interactive.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Link to="/library">
                  <Button size="lg" className="gap-2 text-lg shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                    Începe să citești
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/vocabulary">
                  <Button variant="outline" size="lg" className="gap-2 text-lg">
                    <Languages className="h-5 w-5" />
                    Vezi vocabularul
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="animate-float relative">
                <Card className="mx-auto max-w-sm overflow-hidden shadow-2xl">
                  <div className="bg-reader-bg p-6">
                    <p className="font-reading text-lg leading-relaxed text-reader-text">
                      Quand j'avais six ans j'ai vu, une fois, une{' '}
                      <span className="word-saved">magnifique</span> image, dans un livre 
                      sur la Forêt Vierge qui s'appelait "Histoires Vécues".
                    </p>
                  </div>
                  <div className="border-t border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold">magnifique</span>
                      <span className="text-primary">→ magnificent</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Am văzut o imagine magnifică într-o carte.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Tot ce ai nevoie pentru a învăța
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              O platformă completă care transformă orice carte în material de învățare interactiv.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-none bg-card p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-12">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Începe călătoria ta lingvistică
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Alege o carte și lasă-te purtat de poveste. Vocabularul nou vine natural.
            </p>
            <Link to="/library">
              <Button size="lg" className="gap-2 text-lg shadow-lg">
                <BookOpen className="h-5 w-5" />
                Deschide biblioteca
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>LinguaRead — Învață citind</span>
        </div>
      </footer>
    </div>
  );
}
