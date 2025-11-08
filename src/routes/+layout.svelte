<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import LoadingOverlay from '$lib/ui/LoadingOverlay.svelte';
	import { resolveBootstrap } from '$lib/stores/loading';

	let { children } = $props();

	onMount(() => {
		const fallback = window.setTimeout(() => {
			resolveBootstrap();
		}, 500);
		return () => window.clearTimeout(fallback);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<LoadingOverlay />
{@render children()}
