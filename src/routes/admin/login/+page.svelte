<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Admin sign in</title></svelte:head>

<main class="mx-auto flex min-h-[100svh] max-w-sm flex-col justify-center px-4">
	<h1 class="font-serif text-3xl text-forest-700">Admin sign in</h1>
	<form method="post" class="mt-8 space-y-5"
		use:enhance={() => { busy = true; return async ({ update }) => { await update(); busy = false; }; }}>
		<label class="block text-sm">Email
			<input name="email" type="email" required autocomplete="username" value={form?.email ?? ''}
				class="mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2" />
		</label>
		<label class="block text-sm">Password
			<input name="password" type="password" required autocomplete="current-password"
				class="mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2" />
		</label>
		{#if form?.error}<p role="alert" class="text-sm text-red-800">{form.error}</p>{/if}
		<button disabled={busy} class="w-full rounded-sm bg-forest-700 px-4 py-3 text-cream-100 disabled:opacity-60">
			{busy ? 'Signing in' : 'Sign in'}
		</button>
	</form>
</main>
