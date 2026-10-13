<script lang="ts">
	import { enhance } from '$app/forms';
	import Toast from '$lib/components/admin/Toast.svelte';
	let { form } = $props();
</script>
<svelte:head><title>Account | Admin</title></svelte:head>
{#if form?.saved}<Toast message="Password changed." />{/if}
<header class="adm-head max-w-xl">
	<div>
		<h1 class="adm-title">Account</h1>
		<p class="adm-sub">Change the password you sign in with.</p>
	</div>
</header>
<form method="post" use:enhance class="mt-8 max-w-sm space-y-5">
	<label class="adm-label">Current password<input name="current" type="password" required autocomplete="current-password" class="adm-input font-normal" /></label>
	<label class="adm-label">New password (12+ characters)<input name="next" type="password" required minlength="12" autocomplete="new-password" class="adm-input font-normal" /></label>
	<label class="adm-label">Repeat new password<input name="confirm" type="password" required autocomplete="new-password" class="adm-input font-normal" /></label>
	{#if form?.error}<p role="alert" class="adm-alert">{form.error}</p>{/if}
	<button class="adm-btn">Change password</button>
</form>
