import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, MoveRightIcon, Sparkles, LayoutGrid, Sliders, PenLine, Link2, Smartphone } from "lucide-react";

export default async function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] bg-accent/20 rounded-full blur-[120px] opacity-50 dark:opacity-25" />
        </div>
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-8 animate-slide-up">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors bg-secondary/30">
                <Sparkles size={12} className="mr-1 text-accent" />
                <span>Quote building made simple</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/60">Create Interactive</span>
                  <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/80">Quote Forms</span>
                  <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/60">in Minutes</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-xl leading-relaxed">
                  Build beautiful, customizable forms with conditional logic to generate accurate quotes for your customers.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="group rounded-full shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <Link href="/protected/form-builder">
                    Create a Quote Form
                    <ArrowRightIcon size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <Link href="/protected/dashboard">View Your Forms</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full h-[520px] rounded-xl bg-card p-4 shadow-2xl animate-scale-up gradient-border card-shadow-hover">
                <div className="h-full w-full rounded-lg p-6 flex items-center justify-center glass-effect">
                  <div className="w-full bg-card shadow-lg rounded-lg p-8 animate-slide-up">
                    <div className="w-full h-[6px] bg-secondary mb-8 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-accent rounded-full"></div>
                    </div>
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold">Which option best describes your home?</h3>
                      <div className="grid gap-3">
                        {['Bungalow', 'Semi-Detached', 'Detached', 'Flat', 'Terraced'].map((option, i) => (
                          <div 
                            key={i} 
                            className={`p-4 border rounded-md cursor-pointer flex items-center gap-3 transition-all ${i === 1 ? 'bg-accent text-accent-foreground border-accent' : 'hover:bg-accent/10 hover:border-accent/50'}`}
                          >
                            {i === 1 && <CheckIcon size={18} className="text-accent-foreground" />}
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 md:py-32 bg-secondary/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors bg-primary/10 mb-2">
              <Sparkles size={12} className="mr-1 text-accent" />
              <span>Powerful Features</span>
            </div>
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl gradient-text">Craft the Perfect Quote Experience</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create professional quote forms that convert visitors into customers
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
            {[
              {
                icon: <LayoutGrid className="h-5 w-5 text-accent" />,
                title: "Drag & Drop Builder",
                description: "Intuitive interface makes building complex forms simple with no coding required."
              },
              {
                icon: <Sliders className="h-5 w-5 text-accent" />,
                title: "Conditional Logic",
                description: "Show or hide questions based on previous answers for personalized quotes."
              },
              {
                icon: <PenLine className="h-5 w-5 text-accent" />,
                title: "Custom Styling",
                description: "Brand your forms with custom colors, logos, and styling options."
              },
              {
                icon: <Link2 className="h-5 w-5 text-accent" />,
                title: "Zapier Integration",
                description: "Connect your forms to 3000+ apps with seamless Zapier integration."
              },
              {
                icon: <CheckIcon className="h-5 w-5 text-accent" />,
                title: "Export & Embed",
                description: "Export your form as HTML/CSS/JS to embed anywhere on your website."
              },
              {
                icon: <Smartphone className="h-5 w-5 text-accent" />,
                title: "Mobile Responsive",
                description: "Forms look great on any device - desktop, tablet, or mobile."
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col space-y-3 rounded-2xl border p-8 hover-scale card-shadow-hover bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mb-2">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-24 md:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors bg-primary/10 mb-2">
              <Sparkles size={12} className="mr-1 text-accent" />
              <span>Customer Experiences</span>
            </div>
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Users Say</h2>
              <p className="text-xl text-muted-foreground">
                Join hundreds of businesses already improving their quote process
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "QuoteBuilder has transformed how we handle customer inquiries. Our conversion rate has improved by 35%.",
                author: "Sarah Johnson",
                role: "Marketing Director"
              },
              {
                quote: "The conditional logic feature is a game-changer. Our customers love how personalized their quotes feel.",
                author: "Michael Chen",
                role: "Sales Manager"
              },
              {
                quote: "Setup was incredibly easy and the forms look so professional. It's like having a custom-built solution.",
                author: "Emma Wilson",
                role: "Business Owner"
              }
            ].map((testimonial, i) => (
              <div key={i} className="flex flex-col space-y-4 rounded-2xl border p-8 bg-card card-shadow-hover">
                <div className="flex-1">
                  <p className="italic text-muted-foreground leading-relaxed">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-b from-background to-secondary/40 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] bg-accent/20 rounded-full blur-[120px] opacity-50 dark:opacity-25" />
        </div>
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-3xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl gradient-text">
                Ready to Transform Your Quote Process?
              </h2>
              <p className="text-xl text-muted-foreground">
                Create your first interactive quote form in minutes with no coding required.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-4">
              <Button size="lg" className="w-full group gap-1 rounded-full shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/sign-up">
                  Sign Up for Free
                  <MoveRightIcon size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required. Free plan available.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
