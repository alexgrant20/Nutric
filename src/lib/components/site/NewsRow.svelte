<script lang="ts">
	import { formatDate } from '$lib/format';
	import type { Lang } from '$lib/i18n/config';
	let { lang, item }: { lang: Lang; item: any } = $props();
</script>

<a href="/{lang}/news/{item.slug}" class="block border-t border-forest-700/20 py-5 hover:bg-forest-700/5">
	<p class="text-sm text-stone-600">{formatDate(item.eventDate, lang)}{item.location ? `, ${item.location}` : ''}</p>
	<h3 class="mt-1 font-serif text-xl text-forest-700">{item.t.title}</h3>
</a>
