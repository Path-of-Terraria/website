<script lang="ts">
    import FeatureCard from "$lib/components/FeatureCard.svelte";
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>

    <div class="container mx-auto mt-12">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mx-auto">
                <FeatureCard
                    title="User Management"
                    description="Search and manage user accounts"
                    link="/admin/Users"
                    target=""
                    linkText="Manage Users"
                ></FeatureCard>
            </div>
        </div>
    </div>
</div>'