import { Sparkles } from "lucide-react";
import Container from "../ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-10">
      <Container size="wide" className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-faint)]">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--color-accent-2)]" aria-hidden="true" />
          <span>SummarAIze</span>
        </div>
        <p>Built with Gemini, Groq &amp; OpenAI. Secured by Auth0.</p>
      </Container>
    </footer>
  );
}
