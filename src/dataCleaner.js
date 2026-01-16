/**
 * @file データ削除クラス
 * @description ブラウジングデータの削除処理を担当
 */

import { Logger } from './logger.js';
import { WHITELIST_KEYS } from './constants.js';
import { SettingsManager } from './settingsManager.js';

class DataCleaner {
    /**
     * @param {SettingsManager} settingsManager - 設定管理インスタンス
     */
    constructor(settingsManager) {
        /** @type {SettingsManager} */
        this.settings = settingsManager;
    }

    /**
     * すべてのブラウジングデータを削除
     * @returns {Promise<void>}
     */
    async clearAll() {
        Logger.info('=== データ削除開始 ===');
        const startTime = Date.now();
        
        try {
            await Promise.all([
                this.removeBulkData(),
                this.removeCookies(),
                this.removeCacheAndStorage()
            ]);
            
            const duration = Date.now() - startTime;
            Logger.info(`=== データ削除完了 (${duration}ms) ===`);
        } catch (error) {
            Logger.error('データ削除中にエラーが発生しました:', error);
            throw error;
        }
    }

    /**
     * ホワイトリストを考慮せずブラウジングデータを一括削除
     * @returns {Promise<void>}
     * @private
     */
    async removeBulkData() {
        const dataToRemove = {
            appcache: true,
            downloads: this.settings.removeDownloads,
            formData: this.settings.removeFormData,
            history: this.settings.removeHistory
        };

        return this.removeBrowsingData(
            { since: 0 },
            dataToRemove,
            '一括削除データ',
            this.getBulkDataTypesList(dataToRemove)
        );
    }

    /**
     * 一括削除されるデータのタイプリストを取得
     * @param {Object} dataToRemove
     * @returns {Array<string>}
     * @private
     */
    getBulkDataTypesList(dataToRemove) {
        try {
            const types = [];
            if (dataToRemove.appcache) types.push('appcache');
            if (dataToRemove.downloads) types.push('downloads');
            if (dataToRemove.formData) types.push('formData');
            if (dataToRemove.history) types.push('history');
            return types;
        } catch (error) {
            Logger.error('データタイプリスト取得エラー:', error);
            return [];
        }
    }

    /**
     * ホワイトリストを考慮してCookiesを削除
     * @returns {Promise<void>}
     * @private
     */
    async removeCookies() {
        if (!this.settings.removeCookies) {
            Logger.debug('Cookies削除はスキップします（設定で無効）');
            return;
        }

        const excludeOrigins = this.settings.getOriginsByFlag(WHITELIST_KEYS.KEEP_COOKIES);
        
        return this.removeBrowsingData(
            { since: 0, excludeOrigins },
            { cookies: true },
            'Cookies',
            ['cookies'],
            excludeOrigins.length
        );
    }

    /**
     * ホワイトリストを考慮してキャッシュとストレージを削除
     * @returns {Promise<void>}
     * @private
     */
    async removeCacheAndStorage() {
        if (!this.settings.removeCacheAndStorage) {
            Logger.debug('キャッシュ/ストレージ削除はスキップします（設定で無効）');
            return;
        }

        const excludeOrigins = this.settings.getOriginsByFlag(WHITELIST_KEYS.KEEP_CACHE);
        const dataTypes = {
            cacheStorage: true,
            cache: true,
            fileSystems: true,
            indexedDB: true,
            localStorage: true,
            serviceWorkers: true,
            webSQL: true
        };

        return this.removeBrowsingData(
            { since: 0, excludeOrigins },
            dataTypes,
            'キャッシュ/ストレージ',
            Object.keys(dataTypes),
            excludeOrigins.length
        );
    }

    /**
     * ブラウジングデータを削除する共通メソッド
     * @param {Object} options - 削除オプション
     * @param {Object} dataTypes - 削除するデータタイプ
     * @param {string} categoryName - カテゴリ名（ログ用）
     * @param {Array<string>} typesList - データタイプのリスト（ログ用）
     * @param {number} excludeCount - 除外されたオリジンの数
     * @returns {Promise<void>}
     * @private
     */
    removeBrowsingData(options, dataTypes, categoryName, typesList, excludeCount = 0) {
        return new Promise((resolve, reject) => {
            chrome.browsingData.remove(options, dataTypes, () => {
                if (chrome.runtime.lastError) {
                    Logger.error(`${categoryName}削除エラー:`, chrome.runtime.lastError);
                    return reject(chrome.runtime.lastError);
                }
                
                const excludeInfo = excludeCount > 0 ? ` (除外: ${excludeCount}件)` : '';
                Logger.debug(`${categoryName}の削除完了${excludeInfo}:`, typesList.join(', '));
                resolve();
            });
        });
    }
}

export { DataCleaner };
