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
    import {PollService} from "$lib/services/poll-service";
    import SettingsModal from "$lib/components/SettingsModal.svelte";
    let userService = new UserService();
    let pollService = new PollService();
    const isDebug = import.meta.env.VITE_DEBUG === 'true';
    const viewAdminPanelRole = 'ViewAdminPanel';

    let currentUser = $state<IUser | null>(null);
    let settingsOpen = $state(false);
    let canViewAdminPanel = $derived(currentUser?.roles?.includes(viewAdminPanelRole) ?? false);
    let pendingPollCount = $state(0);

    async function refreshPendingPolls() {
        try {
            const polls = await pollService.getAll();
            pendingPollCount = polls.filter(p => p.isActive && !p.hasAnswered).length;
        } catch (e) {
            pendingPollCount = 0;
        }
    }

    let navbarClass = 'fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-transparent backdrop-blur-sm';
    let brandTextClass = 'text-white';
    let navLinkClass = 'text-white hover:text-gray-200';
    let hamburgerClass = 'text-white';
    let dropdownItemClass = '!text-gray-200 hover:bg-white/[0.06] hover:!text-white';
    let dropdownItemClasses = { active: '!text-white bg-white/[0.06] hover:bg-white/[0.08] hover:!text-white' };

    const unsubscribe = user.subscribe(value => {
        currentUser = value;
        void refreshPendingPolls();
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
        {#if pendingPollCount > 0}
            <NavLi href="/polls" class="font-semibold text-amber-300 hover:text-amber-200">
                <span class="relative inline-flex items-center gap-2">
                    Polls
                    <span class="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-black">
                        {pendingPollCount}
                        <span class="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    </span>
                </span>
            </NavLi>
        {/if}
        {#if isDebug || canViewAdminPanel}
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
        <Dropdown simple triggeredBy="#avatar-menu" class="border border-white/12 bg-[#16212d]/98 text-white shadow-[0_22px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <DropdownHeader class="border-b border-white/8 bg-white/[0.035]">
                <span class="block text-sm font-semibold text-white">{currentUser.profileName}</span>
                <span class="block truncate text-sm font-medium text-gray-300">{currentUser.email}</span>
            </DropdownHeader>
            <DropdownDivider/>
            <DropdownGroup>
                <DropdownItem class={dropdownItemClass} classes={dropdownItemClasses} onclick={() => settingsOpen = true}>
                    Settings
                </DropdownItem>
                <DropdownDivider/>
                <DropdownItem class={dropdownItemClass} classes={dropdownItemClasses} href="profile/{currentUser.profileName}/characters">
                    Characters
                </DropdownItem>
                <DropdownItem class={dropdownItemClass} classes={dropdownItemClasses} href="profile/benefits">
                    Benefits
                </DropdownItem>
                <DropdownDivider/>
                <DropdownItem class={dropdownItemClass} classes={dropdownItemClasses} onclick={() => userService.signout()}>
                    Sign out
                </DropdownItem>
            </DropdownGroup>
        </Dropdown>
    {/if}
</Navbar>

{#if currentUser}
    <SettingsModal bind:open={settingsOpen} bind:currentUser={currentUser}/>
{/if}
