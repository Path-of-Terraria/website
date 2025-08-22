<script>
	import Header from '$lib/components/Header.svelte';
	import './styles.css';
	import Toaster from '$lib/components/Toaster.svelte';
	export const ssr = false;
	export const prerender = true;
	export const trailingSlash = 'always';
</script>
<Toaster />
<div class="app">
	<Header />
	
	<main>
		<slot />
	</main>
</div>
