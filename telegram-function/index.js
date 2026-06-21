'use strict';

const SITE_ID = 'lera-and-nikita';
const MAX = { guestNames: 300, favoriteTrack: 300, legacyComment: 1000 };
const ATTENDANCE = new Set(['Да, с удовольствием!', 'К сожалению, не могу']);
const DRINKS = new Set([
    'Безалкогольные напитки',
    'Вино красное сухое',
    'Вино красное полусладкое',
    'Вино белое сухое',
    'Вино белое полусладкое',
    'Шампанское брют',
    'Шампанское полусладкое',
    'Водка',
    'Самогон',
    'Виски',
    'Коньяк'
]);

exports.handler = async function handler(event) {
    const method = getMethod(event);
    const origin = getHeader(event, 'origin');
    const cors = corsHeaders(origin);

    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: cors, body: '' };
    }

    try {
        if (method === 'GET') {
            return await handleLegacyRequest(event, cors);
        }
        if (method !== 'POST') {
            return jsonResponse(405, { success: false, error: 'Method not allowed' }, cors);
        }
        if (!isOriginAllowed(origin)) {
            return jsonResponse(403, { success: false, error: 'Origin is not allowed' }, cors);
        }

        const data = parseJsonBody(event);
        if (data.site !== SITE_ID) {
            return jsonResponse(400, { success: false, error: 'Unknown site' }, cors);
        }

        // Bots commonly fill hidden fields. Return success without notifying Telegram.
        if (cleanString(data.website, 200)) {
            return jsonResponse(200, { success: true }, cors);
        }

        const guestNames = cleanString(data.guest_names, MAX.guestNames);
        const favoriteTrack = cleanString(data.favorite_track, MAX.favoriteTrack);
        const attendance = cleanString(data.attendance, 100);
        const drinks = Array.isArray(data.drinks)
            ? data.drinks.map((item) => cleanString(item, 100)).filter((item) => DRINKS.has(item))
            : [];

        if (!guestNames) {
            return jsonResponse(400, { success: false, error: 'Guest names are required' }, cors);
        }
        if (!ATTENDANCE.has(attendance)) {
            return jsonResponse(400, { success: false, error: 'Attendance value is invalid' }, cors);
        }

        const message = [
            '💍 <b>Новый ответ: Лера и Никита</b>',
            '',
            `👤 <b>Гости:</b> ${escapeHtml(guestNames)}`,
            `📋 <b>Присутствие:</b> ${escapeHtml(attendance)}`,
            `🥂 <b>Напитки:</b> ${drinks.length ? drinks.map(escapeHtml).join(', ') : 'не указаны'}`,
            `🎵 <b>Любимый трек:</b> ${favoriteTrack ? escapeHtml(favoriteTrack) : 'не указан'}`,
            '',
            `🕐 ${moscowTime()}`
        ].join('\n');

        const chatId = process.env.LERA_NIKITA_CHAT_ID || process.env.CHAT_ID;
        await sendTelegram(message, chatId);
        return jsonResponse(200, { success: true }, cors);
    } catch (error) {
        console.error('RSVP function error:', error);
        const status = error.publicStatus || 500;
        const errorData = {
            success: false,
            error: status === 500 ? 'Internal server error' : error.message
        };
        if (method === 'GET') {
            const params = event.queryStringParameters || {};
            return jsonpResponse(safeCallback(params.callback), errorData, cors);
        }
        return jsonResponse(status, errorData, cors);
    }
};

async function handleLegacyRequest(event, headers) {
    const params = event.queryStringParameters || {};
    const callback = safeCallback(params.callback);

    if (params.ping === '1') {
        return jsonpResponse(callback, { success: true, ping: true }, headers);
    }

    const name = cleanString(params.name, MAX.guestNames);
    const comment = cleanString(params.comment, MAX.legacyComment);
    if (!name) {
        return jsonpResponse(callback, { success: false, error: 'Name is required' }, headers);
    }

    const statusText = params.status === 'yes'
        ? '✅ Буду'
        : params.status === 'no' ? '❌ Не смогу' : '❓ Не указано';
    const message = [
        '🎉 <b>Новый ответ на приглашение!</b>',
        '',
        `👤 <b>Имя:</b> ${escapeHtml(name)}`,
        `📋 <b>Статус:</b> ${statusText}`,
        comment ? `💬 <b>Комментарий:</b> ${escapeHtml(comment)}` : '',
        '',
        `🕐 ${moscowTime()}`
    ].filter(Boolean).join('\n');

    await sendTelegram(message, process.env.CHAT_ID);
    return jsonpResponse(callback, { success: true }, headers);
}

async function sendTelegram(message, chatId) {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken || !chatId) {
        const error = new Error('Telegram environment variables are not configured');
        error.publicStatus = 500;
        throw error;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });

    if (!response.ok) {
        console.error('Telegram API error:', response.status, await response.text());
        throw new Error('Telegram API request failed');
    }
}

function getMethod(event) {
    return (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
}

function getHeader(event, name) {
    const headers = event.headers || {};
    const key = Object.keys(headers).find((item) => item.toLowerCase() === name);
    return key ? headers[key] : '';
}

function corsHeaders(origin) {
    const configured = allowedOrigins();
    const allowedOrigin = configured.length === 0
        ? '*'
        : configured.includes(origin) ? origin : configured[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
    };
}

function allowedOrigins() {
    return (process.env.ALLOWED_ORIGINS || '')
        .split(',').map((item) => item.trim()).filter(Boolean);
}

function isOriginAllowed(origin) {
    const configured = allowedOrigins();
    return configured.length === 0 || configured.includes(origin);
}

function parseJsonBody(event) {
    try {
        const raw = event.isBase64Encoded
            ? Buffer.from(event.body || '', 'base64').toString('utf8')
            : event.body || '{}';
        return JSON.parse(raw);
    } catch (_) {
        const error = new Error('Invalid JSON body');
        error.publicStatus = 400;
        throw error;
    }
}

function cleanString(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeCallback(value) {
    return /^[A-Za-z_$][\w$]{0,100}$/.test(value || '') ? value : 'callback';
}

function moscowTime() {
    return new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function jsonResponse(statusCode, data, headers) {
    return {
        statusCode,
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(data),
        isBase64Encoded: false
    };
}

function jsonpResponse(callback, data, headers) {
    return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/javascript; charset=utf-8' },
        body: `${callback}(${JSON.stringify(data)})`,
        isBase64Encoded: false
    };
}

exports._test = { escapeHtml, safeCallback, cleanString };
