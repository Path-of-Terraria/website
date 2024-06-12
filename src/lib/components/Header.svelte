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

    let currentUser: IUser;
    let settingsOpen = false;

    const unsubscribe = user.subscribe(value => {
        console.log('user', value);
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

        <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
			Path of Terraria
		</span>
    </NavBrand>
    <NavUl>
        <NavLi href="/">Home</NavLi>
        <NavLi href="/leaderboards">Leaderboards</NavLi>
        <NavLi href="https://wiki.pathofterraria.com" target="_blank">Wiki</NavLi>
    </NavUl>

    <div class="flex items-center md:order-2">
        {#if !currentUser}
            <LoginModal/>
        {:else}
            <Avatar id="avatar-menu" src={avatar}/>
            <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
        {/if}

        <NavHamburger class1="w-full md:flex md:w-auto md:order-1"/>
    </div>
    {#if currentUser}
        <Dropdown placement="bottom" triggeredBy="#avatar-menu">
            <DropdownHeader>
                <span class="block text-sm">{currentUser.profileName}</span>
                <span class="block truncate text-sm font-medium">{currentUser.email}</span>
            </DropdownHeader>
            <DropdownItem on:click={() => settingsOpen = true}>Settings</DropdownItem>
            <DropdownDivider/>
            <DropdownItem on:click={() => userService.signout()}>Sign out</DropdownItem>
        </Dropdown>
    {/if}
</Navbar>

<SettingsModal bind:open={settingsOpen} bind:currentUser={currentUser}/>