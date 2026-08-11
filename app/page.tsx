import Link from "next/link";
import Image from "next/image";
import { QrCode, LineChart, Newspaper, ArrowRight } from "lucide-react";

/**
 * Gateway page for the admin console. The club's public-facing landing page is a
 * separate project — it consumes this app's published posts via GET /api/public/posts.
 */
export default function AdminGatewayPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Kallar Central Sports Club crest"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-xl font-bold text-foreground">KCSC</span>
            </div>
            <Link
              href="/login"
              className="cursor-pointer rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            <span className="flex h-2 w-2 rounded-full bg-gold"></span>
            Free tuition for Grades 3, 4 &amp; 5
          </div>
          <h1 className="mb-6 text-5xl tracking-tight text-foreground md:text-7xl">
            Kallar Central Sports Club
          </h1>
          <p className="mx-auto mt-4 mb-10 max-w-2xl text-xl text-muted-foreground">
            The management console for the club&apos;s free tuition programme — attendance,
            marks analysis, and the news published to the club website.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xs transition-colors duration-200 hover:bg-primary/90"
            >
              Enter Admin Portal <ArrowRight size={20} aria-hidden />
            </Link>
          </div>

          <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "QR Attendance",
                body: "Fast, contactless check-in using each student's printed ID card.",
              },
              {
                icon: LineChart,
                title: "Marks Analysis",
                body: "Excel import plus per-subject and per-student reporting on results.",
              },
              {
                icon: Newspaper,
                title: "News & Blog",
                body: "Write posts with images here; they appear on the public club website.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="card-gold-rule p-8 text-left shadow-xs transition-colors duration-200 hover:border-gold"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={24} aria-hidden />
                </div>
                <h3 className="mb-3 text-xl text-foreground">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
