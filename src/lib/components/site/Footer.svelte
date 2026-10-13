<script lang="ts">
 import { useT } from '$lib/i18n/context';
 import type { Lang } from '$lib/i18n/config';
 let { lang, settings, nav, contact }: { lang: Lang; settings: any; nav: { key: string; labelKey: any; path: string }[]; contact: string | null } = $props();
 const t = useT();
 const labels: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube' };
 const socials = $derived((settings?.socialLinks ?? []).filter((s: any) => /^https:\/\//.test(s.url)));
 function backToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
 }
</script>

<footer class="site-footer on-dark">
 <div class="footer-inner">
  <div class="footer-main">
   <div class="footer-brand">
    <a href="/{lang}" class="brand-name">{settings?.brandName}</a>
    <p class="brand-motto">{settings?.t?.tagline || t('footer.motto')}</p>
    {#if settings?.t?.footerNote}<p class="brand-note">{settings.t.footerNote}</p>{/if}
   </div>
   {#if nav.length}
    <nav class="footer-nav" aria-label={t('footer.sections')}>
     <h2>{t('footer.sections')}</h2>
     <ul>
      {#each nav as item (item.key)}<li><a href="/{lang}{item.path}">{t(item.labelKey)}</a></li>{/each}
     </ul>
    </nav>
   {/if}
   {#if socials.length || contact}
    <div class="footer-connect">
     {#if socials.length}
      <nav aria-label={t('footer.follow')}>
       <h2>{t('footer.follow')}</h2>
       <ul class="social-list">
        {#each socials as s, i (i)}<li><a href={s.url} rel="noopener noreferrer" target="_blank"><span>{labels[s.platform] ?? s.platform}</span><span class="external-arrow" aria-hidden="true">↗</span></a></li>{/each}
       </ul>
      </nav>
     {/if}
     {#if contact}
      <div class="footer-contact">
       <h2>{t('footer.contact')}</h2>
       <a href={contact}>{contact.replace(/^(mailto:|tel:|https:\/\/)/, '')}</a>
      </div>
     {/if}
    </div>
   {/if}
  </div>
  <div class="footer-bottom">
   <p>© {new Date().getFullYear()} {settings?.brandName}</p>
   {#if settings?.t?.termsMd}<a class="legal-link" href="/{lang}/terms">{t('footer.terms')}</a>{/if}
   <button type="button" class="back-top" onclick={backToTop}>{t('footer.top')}<span aria-hidden="true">↑</span></button>
  </div>
 </div>
</footer>

<style>
 .site-footer { background: var(--forest-900); color: var(--cream-100); padding: 0 1.5rem; }
 .footer-inner { max-width: 80rem; margin-inline: auto; border-top: 1px solid color-mix(in srgb, var(--cream-100) 25%, transparent); }
 .footer-main { display: flex; flex-wrap: wrap; gap: 3rem 5rem; padding-block: 4rem; }
 .footer-brand { flex: 1.2 1 16rem; }
 .brand-name { display: inline-block; font-family: var(--font-serif-stack); font-size: 2.75rem; line-height: 1; }
 .brand-motto { margin-top: 1.5rem; max-width: 20ch; white-space: pre-line; font-family: var(--font-serif-stack); font-size: clamp(1.5rem, 2vw, 1.8rem); line-height: 1.35; }
 .brand-note { margin-top: 1rem; max-width: 34ch; font-size: .875rem; color: color-mix(in srgb, var(--cream-100) 80%, transparent); }
 h2 { margin: 0; padding-bottom: 1rem; font-size: .875rem; font-weight: 500; border-bottom: 1px solid color-mix(in srgb, var(--cream-100) 25%, transparent); color: color-mix(in srgb, var(--cream-100) 80%, transparent); }
 .footer-nav { flex: 1.2 1 17rem; }
 .footer-nav ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .15rem 2rem; margin-top: .8rem; }
 .footer-connect { flex: .75 1 10rem; min-width: 0; }
 .social-list { margin-top: .8rem; }
 .footer-nav a, .social-list a, .footer-contact a { display: flex; align-items: center; min-height: 44px; padding-block: .5rem; line-height: 1.4; }
 .social-list a { justify-content: space-between; gap: 1rem; }
 .external-arrow { opacity: .7; transition: transform 180ms ease; }
 .footer-contact { margin-top: 2rem; }
 .footer-contact a { overflow-wrap: anywhere; }
 .footer-bottom { border-top: 1px solid color-mix(in srgb, var(--cream-100) 25%, transparent); display: flex; align-items: center; flex-wrap: wrap; gap: .5rem 2rem; padding-block: 1.25rem; font-size: .75rem; color: color-mix(in srgb, var(--cream-100) 80%, transparent); }
 .legal-link { min-height: 44px; display: inline-flex; align-items: center; }
 .back-top { margin-left: auto; display: inline-flex; align-items: center; gap: 1rem; min-height: 44px; cursor: pointer; color: var(--cream-100); }
 .back-top span { font-size: 1.25rem; }
 a { text-underline-offset: .3em; }
 a:hover, .back-top:hover { text-decoration: underline; }
 .social-list a:hover .external-arrow { transform: translate(2px, -2px); }
 @media (max-width: 640px) {
  .site-footer { padding-inline: 1rem; }
  .footer-main { gap: 2.5rem; padding-block: 2.5rem; }
  .footer-brand { flex-basis: 100%; }
  .brand-name { font-size: 2.25rem; }
  .brand-motto { margin-top: 1rem; font-size: 1.5rem; }
  .footer-nav { flex: 1 1 100%; }
  .footer-nav ul { gap: .25rem 1.5rem; }
  .footer-connect { flex: 1 1 100%; }
  .social-list { display: flex; flex-wrap: wrap; gap: .25rem 1.5rem; }
  .social-list a { gap: .5rem; font-size: .875rem; }
  .footer-bottom { gap: .25rem 1rem; }
  .legal-link { order: 3; flex-basis: 100%; }
 }
 @media (prefers-reduced-motion: reduce) { .external-arrow { transition: none; } .social-list a:hover .external-arrow { transform: none; } }
</style>
