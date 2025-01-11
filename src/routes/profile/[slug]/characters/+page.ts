import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, _ }) => {
    const { slug } = params;

    return {
        slug
    };
};