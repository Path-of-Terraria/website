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
    import {type IUser, user} from "$lib/stores/user-store";
    import {onDestroy} from "svelte";
    import LoginModal from "$lib/components/LoginModal.svelte";

    let currentUser: IUser;

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

        <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
			Path of Terraria
		</span>
    </NavBrand>
    <div class="flex items-center md:order-2">
        {#if !currentUser}
            <LoginModal/>
        {:else}
            <Avatar id="avatar-menu" src="/images/profile-picture-3.webp"/>
            <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
        {/if}

        <NavHamburger class1="w-full md:flex md:w-auto md:order-1"/>
    </div>
    <Dropdown placement="bottom" triggeredBy="#avatar-menu">
        <DropdownHeader>
            <span class="block text-sm">Bonnie Green</span>
            <span class="block truncate text-sm font-medium">name@flowbite.com</span>
        </DropdownHeader>
        <DropdownItem>Dashboard</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Earnings</DropdownItem>
        <DropdownDivider/>
        <DropdownItem>Sign out</DropdownItem>
    </Dropdown>
    <NavUl>
        <NavLi href="/">Home</NavLi>
        <NavLi href="/leaderboards">Leaderboards</NavLi>
        <NavLi href="https://wiki.pathofterraria.com" target="_blank">Wiki</NavLi>
    </NavUl>
</Navbar>