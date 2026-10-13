<script lang="ts">
	import { page } from '$app/state';
	import '$lib/components/admin/admin.css';
	let { data, children } = $props();
	const groups: { label: string; links: [string, string][] }[] = [
		{ label: '', links: [['/admin', 'Dashboard']] },
		{ label: 'Content', links: [['/admin/products', 'Products'], ['/admin/collections', 'Collections'], ['/admin/news', 'News'], ['/admin/testimonials', 'Testimonials'], ['/admin/accolades', 'Accolades']] },
		{ label: 'Site', links: [['/admin/sections', 'Landing sections'], ['/admin/settings', 'Settings'], ['/admin/subscribers', 'Subscribers'], ['/admin/account', 'Account']] }
	];
	const here = (href: string) => (href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname === href || page.url.pathname.startsWith(href + '/'));
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>

{#if data.user}
	<div class="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
		<aside class="on-dark bg-forest-900 p-4 text-cream-100 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
			<p class="px-3 py-2 font-serif text-xl">Admin</p>
			<nav aria-label="Admin" class="adm-nav mt-1">
				{#each groups as g (g.label)}
					{#if g.label}<p class="adm-nav-group">{g.label}</p>{/if}
					<div class="flex flex-wrap gap-1 lg:flex-col">
						{#each g.links as [href, label] (href)}
							<a {href} aria-current={here(href) ? 'page' : undefined}>{label}</a>
						{/each}
					</div>
				{/each}
			</nav>
			<div class="mt-6 border-t border-cream-100/20 pt-4">
				<a href="/" target="_blank" rel="noopener" class="adm-nav flex min-h-10 items-center rounded-sm px-3 text-sm text-cream-100/80 hover:text-cream-100 hover:underline">View the site</a>
				<form method="post" action="/admin/logout" class="mt-1">
					<button class="min-h-11 w-full rounded-sm px-3 text-left text-sm text-cream-100/80 hover:bg-cream-100/10 hover:text-cream-100">
						Sign out
						<span class="block truncate text-xs text-cream-100/60">{data.user.email}</span>
					</button>
				</form>
			</div>
		</aside>
		<div class="min-w-0 p-4 sm:p-8">{@render children()}</div>
	</div>
{:else}
	{@render children()}
{/if}
