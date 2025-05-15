import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, MoveRightIcon, Sparkles, LayoutGrid, Sliders, PenLine, Link2, Smartphone } from "lucide-react";

export default async function Home() {
  return (
    <div className="flex flex-col items-center">
 

      {/* CTA Section */}
      <section className="w-full py-20 md:py-32  relative">
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col space-y-8 text-left max-w-3xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl gradient-text">
                Ready to Transform Your Quote Process?
              </h2>
              <p className="text-xl text-muted-foreground">
                Create your first interactive quote form in minutes with no coding required.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="group rounded-full shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <Link href="/form-builder">
                    Create a Quote Form
                    <ArrowRightIcon size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <Link href="/dashboard">View Your Forms</Link>
                </Button>
              </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
