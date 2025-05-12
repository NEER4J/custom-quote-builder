import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, MoveRightIcon } from "lucide-react";

export default async function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-b from-background to-secondary/10">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-6 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                  Create Interactive
                  <span className="block">Quote Forms</span>
                  <span className="block">in Minutes</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-xl">
                  Build beautiful, customizable forms with conditional logic to generate accurate quotes for your customers.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="group" asChild>
                  <Link href="/protected/form-builder">
                    Create a Quote Form
                    <ArrowRightIcon size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/protected/dashboard">View Your Forms</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full h-[480px] rounded-xl border bg-card p-4 shadow-lg hover-scale card-shadow-lg">
                <div className="h-full w-full rounded-lg p-6 flex items-center justify-center glass-effect">
                  <div className="w-full bg-card shadow-lg rounded-lg p-8 animate-slide-up">
                    <div className="w-full h-1.5 bg-secondary mb-8 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-primary rounded-full"></div>
                    </div>
                    <div className="space-y-8">
                      <h3 className="text-xl font-medium">Which option best describes your home?</h3>
                      <div className="grid gap-3">
                        {['Bungalow', 'Semi-Detached', 'Detached', 'Flat', 'Terraced'].map((option, i) => (
                          <div 
                            key={i} 
                            className={`p-4 border rounded-md cursor-pointer flex items-center gap-3 transition-all ${i === 1 ? 'bg-accent border-primary' : 'hover:bg-accent/50 hover:border-primary/50'}`}
                          >
                            {i === 1 && <CheckIcon size={18} className="text-primary" />}
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
      <section className="w-full py-24 md:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Key Features</h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to create professional quote forms
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:gap-8">
            {[
              {
                title: "Easy Form Builder",
                description: "Drag and drop interface makes building forms simple and intuitive."
              },
              {
                title: "Conditional Logic",
                description: "Show or hide questions based on previous answers for personalized quotes."
              },
              {
                title: "Custom Styling",
                description: "Brand your forms with custom colors, logos, and styling options."
              },
              {
                title: "Zapier Integration",
                description: "Connect your forms to 3000+ apps with Zapier integration."
              },
              {
                title: "Export HTML & CSS",
                description: "Export your form as HTML/CSS/JS to embed anywhere on your website."
              },
              {
                title: "Mobile Responsive",
                description: "Forms look great on any device - desktop, tablet, or mobile."
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col space-y-3 rounded-lg border p-6 hover-scale card-shadow bg-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CheckIcon size={18} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-t from-background to-secondary/10">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground">
                Create your first quote form in minutes with no coding required.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Button size="lg" className="w-full group gap-1" asChild>
                <Link href="/sign-up">
                  Sign Up for Free
                  <MoveRightIcon size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
