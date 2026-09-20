import { GOOGLE_REVIEW_URL, SOCIAL_LINKS } from '@/lib/social-links'
import { isLightTone, mutedTextClass, type SectionTone } from '@/components/ui/Section'

const googleIcon = SOCIAL_LINKS.find((item) => item.label === 'Google')?.icon

export function GoogleReviewCta({ tone = 'dark' }: { tone?: SectionTone }) {
  const light = isLightTone(tone)

  return (
    <div
      data-testid="google-cta"
      className={`mt-10 flex flex-col items-center gap-6 rounded-3xl border p-6 text-center md:flex-row md:justify-between md:gap-8 md:rounded-[2.5rem] md:px-8 md:py-7 md:text-left ${
        light ? 'border-graphite/10 bg-white shadow-sm' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex flex-col items-center gap-5 md:flex-row md:gap-6">
        {/* The Google "G" in a white rounded square, like a small app icon. */}
        <span
          data-testid="google-tile"
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/30 [&>svg]:h-9 [&>svg]:w-9"
        >
          {googleIcon}
        </span>
        <div className="max-w-2xl">
          <p className="mb-1 text-lg tracking-[0.3em] text-yellow-400" aria-hidden="true">
            ★★★★★
          </p>
          <p className="text-xl font-bold md:text-2xl">Sua opinião leva a Aguiar mais longe</p>
          <p className={`mt-2 ${mutedTextClass(tone)}`}>
            Foi na Aguiar Veículos e gostou do atendimento? Conte pra nós como foi e ajude outros clientes a chegarem
            até a gente.
          </p>
        </div>
      </div>
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex shrink-0 items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
          light
            ? 'bg-graphite/5 text-graphite hover:bg-graphite hover:text-white focus-visible:outline-graphite'
            : 'bg-white/10 text-white hover:bg-white hover:text-graphite focus-visible:outline-white'
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">{googleIcon}</span>
        Avaliar a Aguiar no Google
      </a>
    </div>
  )
}
