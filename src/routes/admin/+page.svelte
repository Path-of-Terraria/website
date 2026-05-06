<script lang="ts">
    import FeatureCard from "$lib/components/FeatureCard.svelte";
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <h1 class="mb-4 text-3xl font-black tracking-tight text-white">Admin Dashboard</h1>

    <div class="container mx-auto mt-12 px-0">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="mx-auto w-full">
                <FeatureCard
                    title="User Management"
                    description="Search and manage user accounts"
                    link="/admin/Users"
                    target=""
                    linkText="Manage Users"
                ></FeatureCard>
            </div>
            <div class="mx-auto w-full">
                <FeatureCard
                    title="Announcements"
                    description="Broadcast an announcement to all connected mod clients"
                    link="/admin/Announcements"
                    target=""
                    linkText="Send Announcement"
                ></FeatureCard>
            </div>
            <div class="mx-auto w-full">
                <FeatureCard
                    title="Polls"
                    description="Create polls and view active polls"
                    link="/admin/Polls"
                    target=""
                    linkText="Manage Polls"
                ></FeatureCard>
            </div>
        </div>
    </div>
</div>
