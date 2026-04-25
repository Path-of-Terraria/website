import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const { profileName, name } = params;
    return { profileName, name };
};
