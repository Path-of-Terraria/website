<script lang="ts">
	import { Navbar, NavBrand, NavHamburger, NavUl, NavLi } from 'flowbite-svelte';
	import logo from '$lib/images/logo.png';
</script>

<Navbar let:hidden let:toggle color="primary">
	<NavBrand href="/">
		<picture>
			<img class="me-3 h-6 sm:h-9" src={logo} alt="Logo" />
		</picture>

		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
			Path of Terraria
		</span>
	</NavBrand>
	<NavHamburger  />
	<NavUl >
		<NavLi href="/">Home</NavLi>
		<NavLi href="/leaderboards">Leaderboards</NavLi>
		<NavLi href="https://wiki.pathofterraria.com" target="_blank">Wiki</NavLi>
	</NavUl>
</Navbar>