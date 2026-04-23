import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const { name } = params;
    return { name };
};
