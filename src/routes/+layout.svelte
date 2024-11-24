<script>
	import Header from '$lib/components/Header.svelte';
	import './styles.css';
	import {SvelteToast} from "@zerodevx/svelte-toast";
	export const ssr = false;
	export const prerender = true;
	export const trailingSlash = 'always';
	let options = {
		duration: 5000,
		position: 'top-right',
		type: 'success',
	};
</script>
<SvelteToast {options} />
<div class="app">
	<Header />

	<main>
		<slot />
	</main>
</div>
