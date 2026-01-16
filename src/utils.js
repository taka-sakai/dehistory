/**
 * @file 共通ユーティリティ関数
 * @description ホワイトリスト、ドメインバリデーション、UIユーティリティなど
 */

import { Logger } from './logger.js';
import {
    DOMAIN_REGEX,
    DANGEROUS_CHARS_REGEX,
    WHITELIST_KEYS
} from './constants.js';

// ========================================
// 共通ユーティリティ関数
// ========================================

/**
 * ステータスメッセージを表示
 * @param {HTMLElement} statusElement - ステータス表示要素
 * @param {string} message - 表示メッセージ
 * @param {string} [backgroundColor='#f8d7da'] - 背景色（デフォルト: エラー用の赤）
 * @param {string} [color='#721c24'] - 文字色（デフォルト: エラー用の濃い赤）
 * @returns {void}
 */
function displayStatusMessage(statusElement, message, backgroundColor = '#f8d7da', color = '#721c24') {
    try {
        statusElement.textContent = message;
        statusElement.className = 'status';
        statusElement.style.display = 'block';
        statusElement.style.backgroundColor = backgroundColor;
        statusElement.style.color = color;
    } catch (error) {
        Logger.error('ステータスメッセージ表示エラー:', error);
    }
}

/**
 * ステータスメッセージをクリア
 * @param {HTMLElement} statusElement - ステータス表示要素
 * @returns {void}
 */
function clearStatusMessage(statusElement) {
    try {
        statusElement.style.display = 'none';
        statusElement.style.backgroundColor = '';
        statusElement.style.color = '';
    } catch (error) {
        Logger.error('ステータスメッセージクリアエラー:', error);
    }
}

// ========================================
// ドメイン関連のユーティリティ関数
// ========================================

/**
 * ドメイン名のバリデーションを実行
 * @param {string} domain - 検証するドメイン名
 * @returns {{valid: boolean, error: string|null}} バリデーション結果
 * @description 以下のバリデーションを実行:
 * - 空チェック
 * - 長さチェック（253文字以内）
 * - 危険な文字チェック
 * - ワイルドカードチェック
 * - ASCII文字チェック
 * - 正規表現チェック
 * - 連続ドットチェック
 * - 先頭・末尾のドットチェック
 * - 各ラベルの長さチェック（63文字以内）
 */
function validateDomainName(domain) {
    // 空チェック
    if (!domain || domain.length === 0) {
        return { valid: false, error: 'ドメインが空です' };
    }

    // 長さチェック（253文字制限）
    if (domain.length > 253) {
        return { valid: false, error: 'ドメイン名が長すぎます（253文字以内）' };
    }

    // 危険な文字のチェック（制御文字、特殊スペースなど）
    if (DANGEROUS_CHARS_REGEX.test(domain)) {
        return { valid: false, error: '不正な文字が含まれています' };
    }

    // ワイルドカードチェック
    if (domain.includes('*')) {
        return { valid: false, error: 'ワイルドカード(*)は使用できません' };
    }

    // Unicode文字のチェック（ASCII以外の文字を拒否）
    if (!/^[\x00-\x7F]*$/.test(domain)) {
        return { valid: false, error: 'ASCII文字のみ使用できます' };
    }

    // 正規表現チェック
    if (!DOMAIN_REGEX.test(domain)) {
        return { valid: false, error: 'ドメイン名の形式が不正です' };
    }

    // 連続するドットのチェック
    if (domain.includes('..')) {
        return { valid: false, error: '連続するドットは使用できません' };
    }

    // 先頭・末尾のドットチェック
    if (domain.startsWith('.') || domain.endsWith('.')) {
        return { valid: false, error: 'ドメインの先頭または末尾にドットは使用できません' };
    }

    // 各ラベルの長さチェック（63文字制限）
    const parts = domain.split('.');
    for (const label of parts) {
        if (label.length > 63) {
            return { valid: false, error: 'ドメインラベルが長すぎます（63文字以内）' };
        }
    }

    return { valid: true, error: null };
}

// ========================================
// ホワイトリスト関連のユーティリティ関数
// ========================================

/**
 * フラグ値のバリデーション
 * @param {string} flagValue - 検証するフラグ値
 * @returns {boolean} 有効な場合true（0または1のみ許可）
 */
function isValidFlag(flagValue) {
    return flagValue === '0' || flagValue === '1';
}

/**
 * ホワイトリストの1行をパース
 * @param {string} line - パースする行（「ドメイン」または「ドメイン,keepCookies,keepCache」形式）
 * @param {number} lineIndex - 行番号（0始まり）
 * @returns {{success: boolean, entry: string|{domain: string, keepCookies: boolean, keepCache: boolean}|null, error: string|null}} パース結果
 * @description 以下の形式をサポート:
 * - ドメインのみ: "example.com"
 * - フラグ付き: "example.com,1,1"
 */
function parseWhitelistLine(line, lineIndex) {
    try {
        const lineNumber = lineIndex + 1;
        const parts = line.split(',').map(p => p.trim());
        const domain = parts[0];

        // ドメインバリデーション
        const validation = validateDomainName(domain);
        if (!validation.valid) {
            return {
                success: false,
                entry: null,
                error: `行${lineNumber}: ${validation.error} (${line})`
            };
        }

        // ドメインのみの形式
        if (parts.length === 1) {
            return {
                success: true,
                entry: {
                    [WHITELIST_KEYS.DOMAIN]: domain,
                    [WHITELIST_KEYS.KEEP_COOKIES]: 1,
                    [WHITELIST_KEYS.KEEP_CACHE]: 1
                },
                error: null
            };
        }

        // フラグ付き形式（3要素）
        if (parts.length === 3) {
            const keepCookiesStr = parts[1];
            const keepCacheStr = parts[2];

            // フラグのバリデーション
            if (!isValidFlag(keepCookiesStr) || !isValidFlag(keepCacheStr)) {
                return {
                    success: false,
                    entry: null,
                    error: `行${lineNumber}: フラグは 0 または 1 で指定してください (${line})`
                };
            }

            return {
                success: true,
                entry: {
                    [WHITELIST_KEYS.DOMAIN]: domain,
                    [WHITELIST_KEYS.KEEP_COOKIES]: parseInt(keepCookiesStr),
                    [WHITELIST_KEYS.KEEP_CACHE]: parseInt(keepCacheStr)
                },
                error: null
            };
        }

        // 不正な形式
        return {
            success: false,
            entry: null,
            error: `行${lineNumber}: フォーマットが不正です (${line})`
        };
    } catch (error) {
        return {
            success: false,
            entry: null,
            error: `行${lineIndex + 1}: パースエラー (${error.message})`
        };
    }
}

// ========================================
// Export
// ========================================

export {
    displayStatusMessage,
    clearStatusMessage,
    validateDomainName,
    parseWhitelistLine
};
