import fetch from 'node-fetch';

export async function pinterest(query) {
    const baseUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
    const queryParams = {
        source_url: '/search/pins/?q=' + encodeURIComponent(query),
        data: JSON.stringify({
            options: {
                isPrefetch: false,
                query,
                scope: 'pins',
                no_fetch_context_on_resource: false
            },
            context: {}
        }),
        _: Date.now()
    };
    const url = new URL(baseUrl);
    Object.entries(queryParams).forEach(entry => url.searchParams.set(entry[0], entry[1]));

    try {
        const response = await fetch(url.toString());
        const json = await response.json();
        const results = json.resource_response?.data?.results ?? [];
        return results.map(item => ({
            pin: 'https://www.pinterest.com/pin/' + (item.id ?? ''),
            link: item.link ?? '',
            created_at: item.created_at ? (new Date(item.created_at)).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : '',
            id: item.id ?? '',
            images_url: item.images?.['736x']?.url ?? '',
            grid_title: item.grid_title ?? ''
        }));
    } catch (e) {
        return [];
    }
}
