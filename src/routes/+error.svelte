<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="mx-auto flex min-h-[100svh] max-w-xl flex-col justify-center px-4">
	<h1 class="font-serif text-4xl text-forest-700">{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<a href="/" class="mt-6 text-forest-700 underline">Back to home</a>
</main>
