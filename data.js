(function (root) {
    const statuses = ['Interested','Applied','Phone Screen','Technical Interview','Final Round','Offer Received','Accepted','Rejected','No Reply','Ghosted','Withdrawn'];
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    function dateOnly(value) {
        if (!value) return '';
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) throw new Error('Invalid application date');
        const day = value.slice(0,10), date = new Date(day+'T00:00:00Z');
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== day || (value.length>10 && !Number.isFinite(Date.parse(value)))) throw new Error('Invalid application date');
        return day;
    }
    function safeLink(value) {
        if (!value) return '';
        if (typeof value !== 'string' || value.length > 2048) throw new Error('Invalid link');
        const url = new URL(value);
        if (!['http:','https:'].includes(url.protocol)) throw new Error('Links must start with http:// or https://');
        return url.href;
    }
    function validateApplications(rows) {
        if (!Array.isArray(rows) || rows.length > 10000) throw new Error('Expected up to 10,000 applications');
        const ids = new Set();
        return rows.map(row => {
            if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(row.id) || ids.has(row.id)) throw new Error('Invalid or duplicate application ID');
            ids.add(row.id);
            if (!statuses.includes(row.status)) throw new Error('Invalid application status');
            const result = {id:row.id,status:row.status,dateApplied:dateOnly(row.dateApplied),link:safeLink(row.link)};
            for (const key of ['company','jobTitle','salary','notes']) {
                const value = row[key] ?? '';
                if (typeof value !== 'string' || value.length > (key==='notes'?10000:500)) throw new Error('Invalid '+key);
                result[key] = value;
            }
            for (const key of ['createdAt','updatedAt']) if (row[key]) {
                if (typeof row[key] !== 'string' || !Number.isFinite(Date.parse(row[key]))) throw new Error('Invalid timestamp');
                result[key] = new Date(row[key]).toISOString();
            }
            return result;
        });
    }
    function daysSince(value, now = new Date()) {
        const day = dateOnly(value);
        if (!day) return null;
        const today = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
        return Math.max(0,Math.floor((today-Date.parse(day+'T00:00:00Z'))/86400000));
    }
    const api = {statuses,escapeHtml,dateOnly,safeLink,validateApplications,daysSince};
    if (typeof module !== 'undefined') module.exports = api; else root.TrackerData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
