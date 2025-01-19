<script lang="ts">
    import type {ITradeListing} from "$lib/models/trade-listing";

	export let listing: ITradeListing | null = null;
</script>

<div class="trade-listing">
  {listing?.itemData.name} - {listing?.currency} - {listing?.amount}
</div>

<style>

</style>