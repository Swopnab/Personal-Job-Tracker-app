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
            for (const key of ['company','jobTitle','salary','notes','location','term','requisition']) {
                if (['location','term','requisition'].includes(key) && !(key in row)) continue;
                const value = row[key] ?? '';
                if (typeof value !== 'string' || value.length > (key==='notes'?10000:500)) throw new Error('Invalid '+key);
                result[key] = value;
            }
            if ('starred' in row) {if (typeof row.starred!=='boolean') throw new Error('Invalid saved flag');result.starred=row.starred;}
            if ('workArrangement' in row) {if (!['','Unknown','Onsite','Hybrid','Remote'].includes(row.workArrangement)) throw new Error('Invalid work arrangement');result.workArrangement=row.workArrangement;}
            for (const key of ['createdAt','updatedAt','statusUpdatedAt']) if (row[key]) {
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
    function jobLocation(job={}) {
        const location=String(job.location||'').trim();
        const dfw=/\b(dallas|fort[ -]?worth|dfw|plano|irving|richardson|frisco|mckinney|carrollton|addison|grapevine|southlake|coppell|lewisville|denton|westlake|roanoke|allen|garland|mesquite|the colony)\b/i.test(location) || /arlington.*(?:TX|Texas)/i.test(location);
        const texas=dfw||/\b(TX|Texas|Austin|Houston|San Antonio)\b/i.test(location);
        const explicit=String(job.workArrangement||'');
        const arrangement=['Onsite','Hybrid','Remote'].includes(explicit)?explicit:/\bhybrid\b/i.test(location)?'Hybrid':/\bremote\b|home office/i.test(location)?'Remote':/\bon[ -]?site\b/i.test(location)?'Onsite':'Unknown';
        return {location,dfw,region:dfw?'dfw':texas?'texas':!location||/^(see posting|USA|United States)$/i.test(location)?'unknown':'other',arrangement};
    }
    function jobTerm(job={}) {
        const text=[job.term,job.jobTitle].filter(Boolean).join(' ');
        if (/summer.{0,80}2027|2027.{0,80}summer/i.test(text)) return 'Summer 2027';
        if (/spring.{0,40}2027|2027.{0,40}spring/i.test(text)) return 'Spring 2027';
        return job.term || '';
    }
    function roleFocus(job={}) {
        if(job.roleCategory)return job.roleCategory;
        const title=String(job.jobTitle||'');
        return /machine learning|AI[ /&-]|computer vision/i.test(title)?'ai':/data engineer|data scien|analytics/i.test(title)?'data':/full[ -]?stack|front[ -]?end|web develop|mobile app/i.test(title)?'fullstack':/software|back[ -]?end|developer/i.test(title)?'software':'';
    }
    const api = {jobTerm,roleFocus,jobLocation,statuses,escapeHtml,dateOnly,safeLink,validateApplications,daysSince};
    if (typeof module !== 'undefined') module.exports = api; else root.TrackerData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
