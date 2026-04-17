<script lang="ts">
    import FeatureCard from "$lib/components/FeatureCard.svelte";
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <h1 class="mb-4 text-3xl font-black tracking-tight text-white">Mod Data</h1>

    <div class="container mx-auto mt-12 px-0">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="mx-auto w-full">
                <FeatureCard
                        title="Edit Mob Data"
                        description="View and edit the mob data for the mod"
                        link="/mod-data/mobs"
                        target=""
                        linkText="See Data"
                ></FeatureCard>
            </div>
            <div class="mx-auto w-full">
                <FeatureCard
                        title="Edit Localization"
                        description="View and edit the localization for the mod"
                        link="/mod-data/localization"
                        target=""
                        linkText="See Data"
                ></FeatureCard>
            </div>
        </div>
    </div>
</div>
