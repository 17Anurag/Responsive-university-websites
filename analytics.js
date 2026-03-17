// analytics.js - Analytics and tracking module

const Analytics = (() => {
    const SESSION_KEY = 'analytics_session';
    const EVENTS_KEY = 'analytics_events';

    let session = null;
    let eventQueue = [];
    let flushTimer = null;

    function initSession() {
        session = StorageManager.get(SESSION_KEY);
        if (!session || isSessionExpired(session)) {
            session = createSession();
            StorageManager.set(SESSION_KEY, session);
        }
        return session;
    }

    function createSession() {
        return {
            id: generateSessionId(),
            startTime: new Date().toISOString(),
            pageViews: 0,
            events: 0,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    function isSessionExpired(session) {
        const thirtyMinutes = 30 * 60 * 1000;
        return new Date() - new Date(session.startTime) > thirtyMinutes;
    }

    function generateSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function track(eventName, properties = {}) {
        if (!session) initSession();

        const event = {
            id: 'evt_' + Date.now().toString(36),
            name: eventName,
            timestamp: new Date().toISOString(),
            sessionId: session.id,
            page: window.location.pathname,
            properties: {
                ...properties,
                url: window.location.href,
                title: document.title
            }
        };

        eventQueue.push(event);
        session.events++;
        StorageManager.set(SESSION_KEY, session);

        scheduleFlush();
        return event;
    }

    function scheduleFlush() {
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, 5000);
    }

    function flush() {
        if (eventQueue.length === 0) return;

        const events = [...eventQueue];
        eventQueue = [];

        const stored = StorageManager.get(EVENTS_KEY, []);
        StorageManager.set(EVENTS_KEY, [...stored, ...events].slice(-500)); // keep last 500

        console.debug('[Analytics] Flushed', events.length, 'events');
    }

    function trackPageView(page = window.location.pathname) {
        if (!session) initSession();
        session.pageViews++;
        StorageManager.set(SESSION_KEY, session);
        return track('page_view', { page, title: document.title });
    }

    function trackFormStart(formId) {
        return track('form_start', { formId });
    }

    function trackFormSubmit(formId, success, data = {}) {
        return track('form_submit', { formId, success, ...data });
    }

    function trackButtonClick(buttonId, label) {
        return track('button_click', { buttonId, label });
    }

    function trackSearch(query, resultsCount) {
        return track('search', { query, resultsCount });
    }

    function trackModalOpen(modalId) {
        return track('modal_open', { modalId });
    }

    function trackDownload(fileName, fileType) {
        return track('download', { fileName, fileType });
    }

    function getReport() {
        const events = StorageManager.get(EVENTS_KEY, []);
        const eventsByName = events.reduce((acc, e) => {
            acc[e.name] = (acc[e.name] || 0) + 1;
            return acc;
        }, {});

        const pageViews = events.filter(e => e.name === 'page_view');
        const formSubmits = events.filter(e => e.name === 'form_submit');
        const successfulSubmits = formSubmits.filter(e => e.properties.success);

        return {
            totalEvents: events.length,
            eventBreakdown: eventsByName,
            pageViews: pageViews.length,
            formSubmissions: formSubmits.length,
            conversionRate: formSubmits.length > 0
                ? NumberUtils.percentage(successfulSubmits.length, formSubmits.length)
                : 0,
            session: session
        };
    }

    function clearData() {
        StorageManager.remove(SESSION_KEY);
        StorageManager.remove(EVENTS_KEY);
        eventQueue = [];
        session = null;
    }

    // Auto-track page view on load
    document.addEventListener('DOMContentLoaded', () => {
        initSession();
        trackPageView();
    });

    // Flush on page unload
    window.addEventListener('beforeunload', flush);

    return {
        track,
        trackPageView,
        trackFormStart,
        trackFormSubmit,
        trackButtonClick,
        trackSearch,
        trackModalOpen,
        trackDownload,
        getReport,
        clearData,
        getSession: () => session
    };
})();
