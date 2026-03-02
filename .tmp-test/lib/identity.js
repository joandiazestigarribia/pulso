"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANON_SESSION_COOKIE = exports.AUTH_USER_COOKIE = void 0;
exports.getCookieFromRequest = getCookieFromRequest;
exports.buildAnonSessionId = buildAnonSessionId;
exports.isAnonymousSessionId = isAnonymousSessionId;
exports.resolveRequestIdentity = resolveRequestIdentity;
exports.shouldUseSecureCookies = shouldUseSecureCookies;
exports.AUTH_USER_COOKIE = "pulso_user_id";
exports.ANON_SESSION_COOKIE = "pulso_anon_id";
const ANON_PREFIX = "anon_";
function parseCookies(rawCookieHeader) {
    const cookieMap = new Map();
    if (!rawCookieHeader) {
        return cookieMap;
    }
    const pairs = rawCookieHeader.split(";");
    for (const pair of pairs) {
        const [rawKey, ...rawValueParts] = pair.trim().split("=");
        if (!rawKey) {
            continue;
        }
        const rawValue = rawValueParts.join("=");
        cookieMap.set(rawKey, decodeURIComponent(rawValue));
    }
    return cookieMap;
}
function getCookieFromRequest(request, cookieName) {
    const cookieHeader = request.headers.get("cookie");
    const cookieMap = parseCookies(cookieHeader);
    return cookieMap.get(cookieName) ?? null;
}
function buildAnonSessionId() {
    const uuid = typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${ANON_PREFIX}${uuid}`;
}
function isAnonymousSessionId(value) {
    return typeof value === "string" && value.startsWith(ANON_PREFIX);
}
function resolveRequestIdentity(request) {
    const userId = getCookieFromRequest(request, exports.AUTH_USER_COOKIE);
    if (userId) {
        return { userId, anonymousId: null };
    }
    const anonymousId = getCookieFromRequest(request, exports.ANON_SESSION_COOKIE);
    if (anonymousId) {
        return { userId: null, anonymousId };
    }
    return { userId: null, anonymousId: null };
}
function shouldUseSecureCookies(request) {
    if (process.env.NODE_ENV !== "production") {
        return false;
    }
    const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
    if (/^(localhost|127(?:\.\d{1,3}){3})(:\d+)?$/i.test(hostHeader)) {
        return false;
    }
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedProto) {
        const firstProto = forwardedProto.split(",")[0]?.trim().toLowerCase();
        return firstProto === "https";
    }
    if (request.url) {
        if (/^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(:\d+)?/i.test(request.url)) {
            return false;
        }
        return request.url.startsWith("https://");
    }
    return true;
}
