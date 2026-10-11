import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			alias: { $lib: 'src/lib' },
			// adapter-node 6 no longer reads ORIGIN at run time. Behind a TLS proxy set PROTOCOL_HEADER=x-forwarded-proto
			// instead; for a plain-http build (for example the e2e run) set SITE_ORIGIN while building.
			...(process.env.SITE_ORIGIN ? { paths: { origin: process.env.SITE_ORIGIN } } : {})
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
		environment: 'node'
	}
});
