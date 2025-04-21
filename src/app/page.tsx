import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation'
import "./globals.css";



export default function Home() {
  return (
    <BackgroundGradientAnimation>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold text-xl">
              FormPilot
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-foreground/80 hover:text-foreground">
                Features
              </Link>
              <Link href="/use-cases" className="text-sm text-foreground/80 hover:text-foreground">
                Use cases
              </Link>
              <Link href="/pricing" className="text-sm text-foreground/80 hover:text-foreground">
                Pricing
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Build beautiful forms with AI assistance
          </h1>
          <p className="text-xl text-foreground/80 mb-8">
            FormPilot is an AI-first form builder that helps you create, manage, and analyze forms with ease. Just describe what you need, and let AI do the heavy lifting.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="rounded-full px-8">
                Get started for free
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Browse templates
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "AI-Powered Forms",
              description: "Generate complete forms from simple text descriptions using advanced AI."
            },
            {
              title: "Smart Command Menu",
              description: "Use Cmd+K to quickly add fields and modify your forms with AI assistance."
            },
            {
              title: "Beautiful UI",
              description: "Modern, clean interface with customizable themes and responsive design."
            },
            {
              title: "Smart Analytics",
              description: "Get AI-powered insights from your form submissions automatically."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </BackgroundGradientAnimation>
  )
}
