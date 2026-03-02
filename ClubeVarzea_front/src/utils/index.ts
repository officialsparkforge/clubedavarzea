export function createPageUrl(pageName: string) {
    const [rawPage, rawQuery] = pageName.split('?');
    const isAdminPage = /^Admin/.test(rawPage);
    const normalized = isAdminPage
        ? rawPage
        : rawPage
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/\s+/g, '-')
            .toLowerCase();
    const path = '/' + normalized;
    return rawQuery ? `${path}?${rawQuery}` : path;
}