'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('./index');

function postEvent(data, origin = 'https://example.test') {
    return {
        httpMethod: 'POST',
        headers: { origin },
        body: JSON.stringify(data),
        isBase64Encoded: false
    };
}

function validPayload() {
    return {
        site: 'lera-and-nikita',
        guest_names: 'Иван Иванов & Мария',
        attendance: 'Да, с удовольствием!',
        drinks: ['Шампанское', 'Коньяк', 'Поддельное значение'],
        favorite_track: 'Earth, Wind & Fire <September>',
        website: ''
    };
}

test.beforeEach(() => {
    process.env.BOT_TOKEN = 'test-token';
    process.env.CHAT_ID = '111';
    process.env.LERA_NIKITA_CHAT_ID = '';
    process.env.ALLOWED_ORIGINS = '';
});

test.afterEach(() => {
    delete global.fetch;
});

test('routes the new site to its dedicated chat and escapes Telegram HTML', async () => {
    process.env.LERA_NIKITA_CHAT_ID = '222';
    let telegramRequest;
    global.fetch = async (url, options) => {
        telegramRequest = { url, options };
        return { ok: true };
    };

    const response = await handler(postEvent(validPayload()));
    const telegramBody = JSON.parse(telegramRequest.options.body);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), { success: true });
    assert.equal(telegramBody.chat_id, '222');
    assert.match(telegramBody.text, /Иван Иванов &amp; Мария/);
    assert.match(telegramBody.text, /Earth, Wind &amp; Fire &lt;September&gt;/);
    assert.doesNotMatch(telegramBody.text, /Поддельное значение/);
});

test('falls back to the existing CHAT_ID during initial setup', async () => {
    let telegramBody;
    global.fetch = async (_url, options) => {
        telegramBody = JSON.parse(options.body);
        return { ok: true };
    };

    const response = await handler(postEvent(validPayload()));

    assert.equal(response.statusCode, 200);
    assert.equal(telegramBody.chat_id, '111');
});

test('keeps the old Invintation JSONP protocol working', async () => {
    let telegramBody;
    global.fetch = async (_url, options) => {
        telegramBody = JSON.parse(options.body);
        return { ok: true };
    };

    const response = await handler({
        httpMethod: 'GET',
        queryStringParameters: {
            name: 'Старый гость', status: 'yes', comment: 'Комментарий', callback: 'jsonp_cb_123'
        }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(telegramBody.chat_id, '111');
    assert.match(response.body, /^jsonp_cb_123\(\{"success":true\}\)$/);
    assert.match(telegramBody.text, /Старый гость/);
});

test('rejects invalid new-form data without calling Telegram', async () => {
    global.fetch = async () => assert.fail('Telegram must not be called');
    const payload = validPayload();
    payload.attendance = 'invalid';

    const response = await handler(postEvent(payload));

    assert.equal(response.statusCode, 400);
    assert.equal(JSON.parse(response.body).success, false);
});

test('answers CORS preflight without calling Telegram', async () => {
    global.fetch = async () => assert.fail('Telegram must not be called');
    const response = await handler({ httpMethod: 'OPTIONS', headers: { origin: 'https://example.test' } });

    assert.equal(response.statusCode, 204);
    assert.equal(response.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('rejects a POST from an unconfigured browser origin', async () => {
    process.env.ALLOWED_ORIGINS = 'https://wedding.example';
    global.fetch = async () => assert.fail('Telegram must not be called');

    const response = await handler(postEvent(validPayload(), 'https://spam.example'));

    assert.equal(response.statusCode, 403);
    assert.equal(JSON.parse(response.body).success, false);
});
