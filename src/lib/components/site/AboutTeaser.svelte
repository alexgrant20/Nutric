<script lang="ts">
 import { useT } from '$lib/i18n/context';
 let { lang, text, hasFullAbout, productCount = 0, accoladeCount = 0 }: {
  lang: string; text: string; hasFullAbout: boolean; productCount?: number; accoladeCount?: number;
 } = $props();
 const t = useT();
 const motto = $derived(t('footer.motto').split('\n'));
</script>

<section id="about" class="about" aria-labelledby="about-heading">
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
  {#if productCount || accoladeCount}
   <nav class="about-record on-dark" aria-label={t('about.explore')}>
    {#if productCount}
     <a href="/{lang}/products"><span class="record-number">{productCount}</span><span class="record-label">{t('about.stat.products')}</span></a>
    {/if}
    {#if accoladeCount}
     <a href="/{lang}/accolades"><span class="record-number">{accoladeCount}</span><span class="record-label">{t('about.stat.accolades')}</span></a>
    {/if}
   </nav>
  {/if}
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
 .about-record { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); background: var(--forest-700); color: var(--cream-100); }
 .about-record a { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: .5rem; padding: 1rem; min-height: 88px; }
 .about-record a + a { border-left: 1px solid color-mix(in srgb, var(--cream-100) 30%, transparent); }
 .record-number { font-family: var(--font-serif-stack); font-size: 2.75rem; line-height: 1; font-variant-numeric: tabular-nums; }
 .record-label { font-size: .875rem; }
 .about-record a:hover .record-label { text-decoration: underline; text-underline-offset: .3em; }
 @media (min-width: 640px) { .about { padding: 4rem 1.5rem; } .about-record a { flex-direction: row; align-items: center; justify-content: flex-start; gap: 1rem; padding: 1.5rem 2rem; } }
 @media (min-width: 1024px) {
  .about { padding-block: 4.5rem; }
  .about-inner { grid-template-columns: 1.15fr 1fr; column-gap: 5rem; row-gap: 2rem; align-items: center; }
  .about-heading { grid-row: span 2; align-self: center; }
  .about-copy { padding-top: .25rem; }
  .about-record { grid-column: 2; }
 }
 @media (max-width: 360px) { .about-record a { gap: .75rem; padding: 1rem; } .record-number { font-size: 2.25rem; } }
</style>
