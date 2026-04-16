<script lang="ts">
    import {
        Navbar,
        NavBrand,
        NavLi,
        NavUl,
        NavHamburger,
        Avatar,
        Dropdown,
        DropdownItem,
        DropdownHeader,
        DropdownDivider,
        DropdownGroup
    } from 'flowbite-svelte';
    import logo from '$lib/images/logo.png';
    import avatar from '$lib/images/avatar.png';
    import discord from '$lib/images/discord.png';
    import {type IUser, user} from "$lib/stores/user-store";
    import {onDestroy} from "svelte";
    import LoginModal from "$lib/components/LoginModal.svelte";
    import {UserService} from "$lib/services/user-service";
    import SettingsModal from "$lib/components/SettingsModal.svelte";
    import { page } from '$app/state';

    let userService = new UserService();
    const isDebug = import.meta.env.VITE_DEBUG === 'true';

    let currentUser: IUser | null = $state(null);
    let settingsOpen = $state(false);

    // Determine if we're on the home page (runes)
    let isHome = $derived(page?.url?.pathname === '/');

    // Classes depending on route (runes)
    let navbarClass = $derived(
        isHome
            ? 'bg-transparent fixed top-0 left-0 right-0 z-50 backdrop-blur-sm'
            : 'bg-primary-100 dark:bg-primary-700'
    );

    let brandTextClass = $derived(isHome ? 'text-white' : 'text-primary-700');

    let navLinkClass = $derived(
        isHome
            ? 'text-gray-900 hover:text-primary-700 md:text-white md:hover:text-gray-200'
            : 'text-gray-900 hover:text-primary-700'
    );

    let hamburgerClass = $derived(isHome ? 'text-white' : '');

    const unsubscribe = user.subscribe(value => {
        currentUser = value;
    });

    // Cleanup on component destruction
    onDestroy(() => {
        unsubscribe();
    });
</script>
<Navbar class={`${navbarClass} flex-nowrap`}>
    <NavBrand href="/" class="min-w-0 shrink">
        <img class="me-2 h-12 w-auto shrink-0 sm:h-14" src={logo} alt="Logo"/>

        <span class={`hidden self-center whitespace-nowrap text-xl font-semibold md:inline ${brandTextClass}`}>
			Path of Terraria
		</span>
    </NavBrand>
    <style>ul {gap: 16px; }</style>
    <NavUl>
        <NavLi href="/" class={navLinkClass}>Home</NavLi>
        <NavLi href="/leaderboards" class={navLinkClass}>Leaderboards</NavLi>
        <NavLi href="/trade" class={navLinkClass}>Trade</NavLi>
        <NavLi href="/tools" class={navLinkClass}>Tools</NavLi>
        <NavLi href="https://wiki.pathofterraria.com" target="_blank" class={navLinkClass}>Wiki</NavLi>
        {#if isDebug}
            <NavLi href="/mod-data" class={navLinkClass}>Mod Data</NavLi>
            <NavLi href="/admin" class={navLinkClass}>Admin</NavLi>
        {/if}
    </NavUl>

    <div class="ml-2 flex shrink-0 items-center justify-end gap-2 md:order-2 md:min-w-[194px] md:gap-4">
        {#if !currentUser}
            <LoginModal/>
        {:else}
            <Avatar id="avatar-menu" src={avatar} class="h-10 w-10 shrink-0 cursor-pointer"/>
        {/if}

        <a href="https://discord.gg/5c2GrFQReE" target="_blank" class="shrink-0">
            <Avatar src={discord} class="h-10 w-10 shrink-0 cursor-pointer"/>
        </a>

        <NavHamburger class={`shrink-0 md:order-1 md:hidden ${hamburgerClass}`}/>
    </div>
    {#if currentUser}
        <Dropdown simple triggeredBy="#avatar-menu">
            <DropdownHeader>
                <span class="block text-sm">{currentUser.profileName}</span>
                <span class="block truncate text-sm font-medium">{currentUser.email}</span>
            </DropdownHeader>
            <DropdownDivider/>
            <DropdownGroup>
                <DropdownItem onclick={() => settingsOpen = true}>
                    Settings
                </DropdownItem>
                <DropdownDivider/>
                <DropdownItem href="profile/{currentUser.profileName}/characters">
                    Characters
                </DropdownItem>
                <DropdownItem href="profile/benefits">
                    Benefits
                </DropdownItem>
                <DropdownDivider/>
                <DropdownItem onclick={() => userService.signout()}>
                    Sign out
                </DropdownItem>
            </DropdownGroup>
        </Dropdown>
    {/if}
</Navbar>

<SettingsModal bind:open={settingsOpen} bind:currentUser={currentUser}/>
