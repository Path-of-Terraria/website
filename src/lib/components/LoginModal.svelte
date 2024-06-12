<script>
    import { Button, Modal, Label, Input } from 'flowbite-svelte';
    let defaultModal = false;

    import {HttpService} from '$lib/services/http-service';
    let httpService = new HttpService();
</script>

<Button on:click={() => (defaultModal = true)}>Login</Button>
<Modal title="Login / Signup" bind:open={defaultModal} autoclose>
    <div class="mb-6">
        <Label for="small-input" class="block mb-2">Email</Label>
        <Input id="small-input" size="sm" placeholder="Email" />
    </div>
    <div class="mb-6">
        <Label for="small-input" class="block mb-2">Password</Label>
        <Input id="small-input" size="sm" placeholder="Password" />
    </div>
    <svelte:fragment slot="footer">
        <div class="text-right">
            <Button on:click={async () => {
               await httpService.get("Ping");
            }}>
                I accept
            </Button>
            <Button color="alternative">
                Decline
            </Button>
        </div>
    </svelte:fragment>
</Modal>