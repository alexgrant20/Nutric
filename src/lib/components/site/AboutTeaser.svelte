<script lang="ts">
 import { useT } from '$lib/i18n/context';
 import { scrollProgress } from '../ui/motion';
 let { lang, text, hasFullAbout }: { lang: string; text: string; hasFullAbout: boolean } = $props();
 const t = useT();
 const motto = $derived(t('footer.motto').split('\n'));
</script>

<section id="about" class="about" aria-labelledby="about-heading" use:scrollProgress>
 <div class="about-inner">
  <header class="about-heading">
   <h2 id="about-heading">{t('about.title')}</h2>
   <p class="motto">
    {#each motto as line, i (i)}<span class:human-line={i === motto.length - 1}>{line}</span>{/each}
   </p>
  </header>
  <div class="about-copy">
   <p class="statement">{text}</p>
   {#if hasFullAbout}<a href="/{lang}/about" class="read-about">{t('about.more')}</a>{/if}
  </div>
  <!-- The motto as one line: a molecule (science) whose bond grows into a leaf (life). It draws itself as the section scrolls in. -->
  <svg class="motif" viewBox="0 0 520 140" aria-hidden="true">
   <path pathLength="1" d="M60 36 L89.4 53 L89.4 87 L60 104 L30.6 87 L30.6 53 Z" />
   <circle pathLength="1" cx="60" cy="70" r="17" />
   <path pathLength="1" d="M89.4 53 L122 34 C200 -6 260 130 340 92 S430 40 452 58" />
   <path class="leaf" pathLength="1" d="M452 58 C470 30 505 26 514 34 C506 62 478 80 452 58 Z" />
   <path pathLength="1" d="M452 58 C474 50 496 42 514 34" />
  </svg>
 </div>
</section>

<style>
 .about { background: var(--cream-100); color: var(--forest-700); padding: 3rem 1rem; scroll-margin-top: 5rem; }
 .about-inner { max-width: 80rem; margin-inline: auto; display: grid; gap: 2rem; }
 h2 { font-size: 1rem; font-weight: 500; margin-bottom: 1.5rem; }
 .motto { font-family: var(--font-serif-stack); font-size: clamp(2.4rem, 5vw, 4.6rem); line-height: 1.08; letter-spacing: -.025em; }
 .motto span { display: block; }
 .human-line { font-style: italic; margin-top: .15em; }
 .statement { max-width: 48ch; font-size: clamp(1.1rem, 1.7vw, 1.35rem); line-height: 1.6; }
 .read-about { display: inline-flex; align-items: center; min-height: 48px; margin-top: 1rem; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .4em; }
 .read-about:hover { text-decoration-thickness: 2px; }
 .motif { width: 100%; max-width: 32rem; height: auto; overflow: visible; --draw: min(1, var(--p, 1) * 2.4); }
 .motif path, .motif circle { fill: none; stroke: var(--forest-700); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: calc(1 - var(--draw)); }
 /* The leaf takes the accent only once the line has reached it. */
 .motif .leaf { fill: var(--lime-400); fill-opacity: clamp(0, (var(--draw) - .85) * 6.6, 1); }
 @media (min-width: 640px) { .about { padding: 4rem 1.5rem; } }
 @media (min-width: 1024px) {
  .about { padding-block: 4.5rem; }
  .about-inner { grid-template-columns: 1.15fr 1fr; column-gap: 5rem; row-gap: 2rem; align-items: center; }
  .about-heading { grid-row: span 2; align-self: center; }
  .about-copy { padding-top: .25rem; }
  .motif { grid-column: 2; }
 }
</style>
