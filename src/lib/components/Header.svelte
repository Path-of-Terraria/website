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
        DropdownDivider
    } from 'flowbite-svelte';
    import logo from '$lib/images/logo.png';
    import avatar from '$lib/images/avatar.png';
    import {type IUser, user} from "$lib/stores/user-store";
    import {onDestroy} from "svelte";
    import LoginModal from "$lib/components/LoginModal.svelte";
    import {UserService} from "$lib/services/user-service";
    import SettingsModal from "$lib/components/SettingsModal.svelte";
    let userService = new UserService();
    const isDebug = import.meta.env.VITE_DEBUG === 'true';

    let currentUser: IUser;
    let settingsOpen = false;

    const unsubscribe = user.subscribe(value => {
        // @ts-ignore
        currentUser = value;
    });

    // Cleanup on component destruction
    onDestroy(() => {
        unsubscribe();
    });
</script>
<Navbar color="primary">
    <NavBrand href="/">
        <picture>
            <img class="me-3 h-6 sm:h-9" src={logo} alt="Logo"/>
        </picture>

        <h1 class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
			Path of Terraria
		</h1>
    </NavBrand>
    <NavUl>
        <NavLi href="/">Home</NavLi>
        <NavLi href="/leaderboards">Leaderboards</NavLi>
        <NavLi href="/trade">Trade</NavLi>
        <NavLi href="https://wiki.pathofterraria.com" target="_blank">Wiki</NavLi>
        {#if isDebug}
            <NavLi href="/mod-data">Mod Data</NavLi>
            <NavLi href="/admin">Admin</NavLi>
        {/if}
    </NavUl>

    <div class="flex items-center md:order-2">
        {#if !currentUser}
            <LoginModal/>
        {:else}
            <Avatar id="avatar-menu" src={avatar} class="cursor-pointer"/>
        {/if}

        <NavHamburger class="w-full sm:flex md:w-auto md:order-1 md:hidden"/>
    </div>
    {#if currentUser}
        <Dropdown placement="bottom" triggeredBy="#avatar-menu">
            <DropdownHeader>
                <span class="block text-sm">{currentUser.profileName}</span>
                <span class="block truncate text-sm font-medium">{currentUser.email}</span>
            </DropdownHeader>
            <DropdownItem on:click={() => settingsOpen = true}>
                Settings
            </DropdownItem>
            <DropdownDivider/>
            <DropdownItem>
                <NavLi href="profile/{currentUser.profileName}/characters">
                    Characters
                </NavLi>
            </DropdownItem>
            <DropdownDivider/>
            <DropdownItem on:click={() => userService.signout()}>
                Sign out
            </DropdownItem>
        </Dropdown>
    {/if}
</Navbar>

<SettingsModal bind:open={settingsOpen} bind:currentUser={currentUser}/>