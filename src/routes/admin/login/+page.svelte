<script lang="ts">
	import { enhance } from '$app/forms';
	import '$lib/components/admin/admin.css';
	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Admin sign in</title></svelte:head>

<main class="grid min-h-[100svh] lg:grid-cols-[1fr_28rem]">
	<div class="on-dark hidden bg-forest-900 p-12 text-cream-100 lg:flex lg:flex-col lg:justify-end">
		<p class="font-serif text-5xl leading-tight">Progressing Science,<br />Uplifting Lives.</p>
		<p class="mt-4 text-cream-100/80">Nutric site admin</p>
	</div>
	<div class="mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 lg:max-w-none lg:px-14">
		<h1 class="adm-title">Admin sign in</h1>
		<form method="post" class="mt-8 space-y-5"
			use:enhance={() => { busy = true; return async ({ update }) => { await update(); busy = false; }; }}>
			<label class="adm-label">Email
				<input name="email" type="email" required autocomplete="username" value={form?.email ?? ''} class="adm-input font-normal" />
			</label>
			<label class="adm-label">Password
				<input name="password" type="password" required autocomplete="current-password" class="adm-input font-normal" />
			</label>
			{#if form?.error}<p role="alert" class="adm-alert">{form.error}</p>{/if}
			<button disabled={busy} class="adm-btn w-full">{busy ? 'Signing in' : 'Sign in'}</button>
		</form>
	</div>
</main>
