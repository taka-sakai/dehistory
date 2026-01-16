/**
 * @file オプションページのスクリプト
 * @description ホワイトリストと実行設定を管理するUIロジック
 */

import { Logger } from './logger.js';
import {
    DEFAULT_SETTINGS,
    STORAGE_KEYS,
    WHITELIST_KEYS
} from './constants.js';

import {
    displayStatusMessage,
    clearStatusMessage,
    parseWhitelistLine
} from './utils.js';

/**
 * ページ読み込み時にストレージからホワイトリストと設定を読み込んで表示
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        chrome.storage.local.get([
            STORAGE_KEYS.WHITELIST,
            STORAGE_KEYS.RUN_ON_STARTUP,
            STORAGE_KEYS.RUN_ON_CLOSE,
            STORAGE_KEYS.REMOVE_DOWNLOADS,
            STORAGE_KEYS.REMOVE_FORMDATA,
            STORAGE_KEYS.REMOVE_HISTORY,
            STORAGE_KEYS.REMOVE_COOKIES,
            STORAGE_KEYS.REMOVE_CACHE_AND_STORAGE
        ], (result) => {
            try {
                Logger.debug('読み込んだ設定:', result);

                if (chrome.runtime.lastError) {
                    Logger.error('設定読み込みエラー:', chrome.runtime.lastError);
                    displayStatusMessage(document.getElementById('status'), '✕ 設定の読み込みに失敗しました');
                    return;
                }

                // 配列であることを保証
                const whitelist = result[STORAGE_KEYS.WHITELIST] || [];

                // オブジェクト形式からカンマ区切り形式に変換して表示
                const lines = whitelist.map(entry => {
                    const domain = entry[WHITELIST_KEYS.DOMAIN];
                    const keepCookies = entry[WHITELIST_KEYS.KEEP_COOKIES] ? 1 : 0;
                    const keepCache = entry[WHITELIST_KEYS.KEEP_CACHE] ? 1 : 0;
                    return `${domain},${keepCookies},${keepCache}`;
                });
                document.getElementById('whitelist').value = lines.join('\n');
                document.getElementById('runOnStartup').checked = result[STORAGE_KEYS.RUN_ON_STARTUP] ?? DEFAULT_SETTINGS.RUN_ON_STARTUP;
                document.getElementById('runOnClose').checked = result[STORAGE_KEYS.RUN_ON_CLOSE] ?? DEFAULT_SETTINGS.RUN_ON_CLOSE;
                document.getElementById('removeDownloads').checked = result[STORAGE_KEYS.REMOVE_DOWNLOADS] ?? DEFAULT_SETTINGS.REMOVE_DOWNLOADS;
                document.getElementById('removeFormData').checked = result[STORAGE_KEYS.REMOVE_FORMDATA] ?? DEFAULT_SETTINGS.REMOVE_FORMDATA;
                document.getElementById('removeHistory').checked = result[STORAGE_KEYS.REMOVE_HISTORY] ?? DEFAULT_SETTINGS.REMOVE_HISTORY;
                document.getElementById('removeCookies').checked = result[STORAGE_KEYS.REMOVE_COOKIES] ?? DEFAULT_SETTINGS.REMOVE_COOKIES;
                document.getElementById('removeCacheAndStorage').checked = result[STORAGE_KEYS.REMOVE_CACHE_AND_STORAGE] ?? DEFAULT_SETTINGS.REMOVE_CACHE_AND_STORAGE;
            } catch (error) {
                Logger.error('設定読み込み処理エラー:', error);
                displayStatusMessage(document.getElementById('status'), '✕ 予期しないエラーが発生しました');
            }
        });
    } catch (error) {
        Logger.error('DOMContentLoadedエラー:', error);
        displayStatusMessage(document.getElementById('status'), '✕ 初期化に失敗しました');
    }
});

/**
 * 保存ボタンのクリックイベントハンドラー
 * @description ホワイトリストと設定をバリデーションしてストレージに保存
 */
document.getElementById('save').addEventListener('click', () => {
    try {
        const saveButton = document.getElementById('save');
        // 連打防止：ボタンを無効化
        saveButton.disabled = true;

        const textarea = document.getElementById('whitelist');
        const lines = textarea.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const whitelist = [];
        const invalidLines = [];

        // 各行をパース: [ドメイン,keepCookies,keepCache]形式または[ドメイン]形式
        lines.forEach((line, index) => {
            const result = parseWhitelistLine(line, index);
            if (result.success) {
                whitelist.push(result.entry);
            } else {
                invalidLines.push(result.error);
            }
        });

    // バリデーションエラーがあれば警告表示して保存を中止
    if (invalidLines.length > 0) {
        Logger.warn('ホワイトリストのバリデーションエラー:', invalidLines);
        const errorList = document.getElementById('errorList');
        const errorItems = document.getElementById('errorItems');
        errorItems.innerHTML = invalidLines.map(error => `<li>${error}</li>`).join('');
        errorList.style.display = 'block';

        displayStatusMessage(document.getElementById('status'), `⚠ ${invalidLines.length}件のエラーがあります`);
        saveButton.disabled = false;
        return;
    }

    // ドメインの重複チェック
    const domainMap = new Map();
    const duplicates = [];
    whitelist.forEach((entry, index) => {
        const domain = entry[WHITELIST_KEYS.DOMAIN];
        if (domainMap.has(domain)) {
            duplicates.push(`行${index + 1}: ドメイン "${domain}" が重複しています（最初の出現: 行${domainMap.get(domain) + 1}）`);
        } else {
            domainMap.set(domain, index);
        }
    });

    if (duplicates.length > 0) {
        Logger.warn('ドメインの重複エラー:', duplicates);
        const errorList = document.getElementById('errorList');
        const errorItems = document.getElementById('errorItems');
        errorItems.innerHTML = duplicates.map(error => `<li>${error}</li>`).join('');
        errorList.style.display = 'block';

        displayStatusMessage(document.getElementById('status'), `⚠ ドメインの重複があります`);
        saveButton.disabled = false;
        return;
    }

    const runOnStartup = document.getElementById('runOnStartup').checked;
    const runOnClose = document.getElementById('runOnClose').checked;
    const removeDownloads = document.getElementById('removeDownloads').checked;
    const removeFormData = document.getElementById('removeFormData').checked;
    const removeHistory = document.getElementById('removeHistory').checked;
    const removeCookies = document.getElementById('removeCookies').checked;
    const removeCacheAndStorage = document.getElementById('removeCacheAndStorage').checked;

    chrome.storage.local.set({
        [STORAGE_KEYS.WHITELIST]: whitelist,
        [STORAGE_KEYS.RUN_ON_STARTUP]: runOnStartup,
        [STORAGE_KEYS.RUN_ON_CLOSE]: runOnClose,
        [STORAGE_KEYS.REMOVE_DOWNLOADS]: removeDownloads,
        [STORAGE_KEYS.REMOVE_FORMDATA]: removeFormData,
        [STORAGE_KEYS.REMOVE_HISTORY]: removeHistory,
        [STORAGE_KEYS.REMOVE_COOKIES]: removeCookies,
        [STORAGE_KEYS.REMOVE_CACHE_AND_STORAGE]: removeCacheAndStorage
    }, () => {
            try {
                if (chrome.runtime.lastError) {
                    Logger.error('設定保存エラー:', chrome.runtime.lastError);
                    displayStatusMessage(document.getElementById('status'), '✕ 設定の保存に失敗しました');
                    saveButton.disabled = false;
                    return;
                }

                const status = document.getElementById('status');
                status.textContent = `✓ 設定を保存しました`;
                status.className = 'status success';
                status.style.display = '';  // インラインスタイルをクリア
                status.style.backgroundColor = '';
                status.style.color = '';
                setTimeout(() => {
                    status.className = 'status';
                    saveButton.disabled = false;
                }, 3000);
            } catch (error) {
                Logger.error('設定保存後処理エラー:', error);
                displayStatusMessage(document.getElementById('status'), '✕ 予期しないエラーが発生しました');
                saveButton.disabled = false;
            }
        });
    } catch (error) {
        Logger.error('保存処理エラー:', error);
        displayStatusMessage(document.getElementById('status'), '✕ 予期しないエラーが発生しました');
        const saveButton = document.getElementById('save');
        if (saveButton) saveButton.disabled = false;
    }
});

/**
 * ツールチップの表示/非表示を切り替える
 * @param {Event} e - クリックイベント
 */
document.getElementById('helpIcon').addEventListener('click', (e) => {
    try {
        e.stopPropagation();
        const tooltip = document.getElementById('tooltipContent');
        tooltip.classList.toggle('show');
    } catch (error) {
        Logger.error('ツールチップ表示エラー:', error);
    }
});

document.getElementById('closeTooltip').addEventListener('click', (e) => {
    try {
        e.stopPropagation();
        const tooltip = document.getElementById('tooltipContent');
        tooltip.classList.remove('show');
    } catch (error) {
        Logger.error('ツールチップ閉じるエラー:', error);
    }
});

// 終了時オプションのツールチップ
document.getElementById('helpIconClose').addEventListener('click', (e) => {
    try {
        e.stopPropagation();
        const tooltip = document.getElementById('tooltipContentClose');
        tooltip.classList.toggle('show');
    } catch (error) {
        Logger.error('ツールチップ表示エラー:', error);
    }
});

document.getElementById('closeTooltipClose').addEventListener('click', (e) => {
    try {
        e.stopPropagation();
        const tooltip = document.getElementById('tooltipContentClose');
        tooltip.classList.remove('show');
    } catch (error) {
        Logger.error('ツールチップ閉じるエラー:', error);
    }
});

// ツールチップ外をクリックしたら閉じる
document.addEventListener('click', (e) => {
    try {
        const tooltip = document.getElementById('tooltipContent');
        const tooltipClose = document.getElementById('tooltipContentClose');
        const helpIcon = document.getElementById('helpIcon');
        const helpIconClose = document.getElementById('helpIconClose');
        
        if (!tooltip.contains(e.target) && e.target !== helpIcon) {
            tooltip.classList.remove('show');
        }
        
        if (!tooltipClose.contains(e.target) && e.target !== helpIconClose) {
            tooltipClose.classList.remove('show');
        }
    } catch (error) {
        Logger.error('ツールチップ外クリック処理エラー:', error);
    }
});

/**
 * エラーリストを閉じる
 */
document.getElementById('closeErrorList').addEventListener('click', () => {
    try {
        const errorList = document.getElementById('errorList');
        errorList.style.display = 'none';
    } catch (error) {
        Logger.error('エラーリスト閉じる処理エラー:', error);
    }
});