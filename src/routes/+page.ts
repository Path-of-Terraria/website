import type { PageLoad } from './$types';

export const prerender = true;
export const ssr = false;
export const trailingSlash = 'ignore';

export const load: PageLoad = ({ params }) => {
    console.log('params', params);
};