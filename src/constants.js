// ========================================
// デフォルト設定値（グループ化）
// ========================================

/**
 * デフォルト設定値
 * @const {Object}
 */
export const DEFAULT_SETTINGS = {
    WHITELIST_KEEP_COOKIES: 1,
    WHITELIST_KEEP_CACHE: 1,
    RUN_ON_STARTUP: false,
    RUN_ON_CLOSE: false,
    REMOVE_DOWNLOADS: true,
    REMOVE_FORMDATA: true,
    REMOVE_HISTORY: true,
    REMOVE_COOKIES: true,
    REMOVE_CACHE_AND_STORAGE: true
};

/**
 * ストレージキー名
 * @const {Object}
 */
export const STORAGE_KEYS = {
    WHITELIST: 'whitelist',
    RUN_ON_STARTUP: 'runOnStartup',
    RUN_ON_CLOSE: 'runOnClose',
    REMOVE_DOWNLOADS: 'removeDownloads',
    REMOVE_FORMDATA: 'removeFormData',
    REMOVE_HISTORY: 'removeHistory',
    REMOVE_COOKIES: 'removeCookies',
    REMOVE_CACHE_AND_STORAGE: 'removeCacheAndStorage'
};

/**
 * ホワイトリストのキー名
 * @const {Object}
 */
export const WHITELIST_KEYS = {
    DOMAIN: 'domain',
    KEEP_COOKIES: 'keepCookies',
    KEEP_CACHE: 'keepCache'
};

// ========================================
// バリデーション用の正規表現
// ========================================

/**
 * ドメイン名のバリデーション用正規表現
 * @constant {RegExp}
 * @description HTTPS用の標準的なドメイン名規則
 * - 英数字、ハイフン、ドットのみ使用可
 * - 各ラベル（ドット区切り）は英数字で始まり英数字で終わる
 * - TLD（最上位ドメイン）は2文字以上の英字
 */
export const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * 危険な文字を検出する正規表現
 * @constant {RegExp}
 * @description 制御文字、特殊スペースなどを検出
 */
export const DANGEROUS_CHARS_REGEX = /[\x00-\x1f\x7f-\x9f\u2000-\u200f\u2028-\u202f\u205f-\u206f]/;
