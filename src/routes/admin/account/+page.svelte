<script lang="ts">
	import { enhance } from '$app/forms';
	import Toast from '$lib/components/admin/Toast.svelte';
	let { form } = $props();
	const input = 'mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2';
</script>
<svelte:head><title>Account | Admin</title></svelte:head>
{#if form?.saved}<Toast message="Password changed." />{/if}
<h1 class="font-serif text-3xl text-forest-700">Account</h1>
<form method="post" use:enhance class="mt-6 max-w-sm space-y-4">
	<label class="block text-sm">Current password<input name="current" type="password" required autocomplete="current-password" class={input} /></label>
	<label class="block text-sm">New password (12+ characters)<input name="next" type="password" required minlength="12" autocomplete="new-password" class={input} /></label>
	<label class="block text-sm">Repeat new password<input name="confirm" type="password" required autocomplete="new-password" class={input} /></label>
	{#if form?.error}<p role="alert" class="text-sm text-red-800">{form.error}</p>{/if}
	<button class="min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100">Change password</button>
</form>
