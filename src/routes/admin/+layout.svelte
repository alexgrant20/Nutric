<script lang="ts">
	let { data, children } = $props();
	const links = [
		['/admin', 'Dashboard'], ['/admin/products', 'Products'], ['/admin/collections', 'Collections'], ['/admin/news', 'News'],
		['/admin/testimonials', 'Testimonials'], ['/admin/accolades', 'Accolades'], ['/admin/sections', 'Landing sections'],
		['/admin/settings', 'Settings'], ['/admin/subscribers', 'Subscribers'], ['/admin/account', 'Account']
	];
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>

{#if data.user}
	<div class="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
		<aside class="on-dark bg-forest-900 p-4 text-cream-100">
			<p class="px-3 py-2 font-serif text-xl">Admin</p>
			<nav aria-label="Admin" class="mt-2 flex flex-wrap gap-1 lg:flex-col">
				{#each links as [href, label] (href)}
					<a {href} class="flex min-h-11 items-center rounded-sm px-3 text-sm hover:bg-cream-100/10">{label}</a>
				{/each}
			</nav>
			<form method="post" action="/admin/logout" class="mt-4">
				<button class="min-h-11 w-full rounded-sm border border-cream-100/40 px-3 text-left text-sm">Sign out ({data.user.email})</button>
			</form>
		</aside>
		<div class="p-4 sm:p-8">{@render children()}</div>
	</div>
{:else}
	{@render children()}
{/if}
