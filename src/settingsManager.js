/**
 * @file 設定管理クラス
 * @description ストレージからの設定読み込みと管理を担当
 */

import { Logger } from './logger.js';
import {
    DEFAULT_SETTINGS,
    STORAGE_KEYS,
    WHITELIST_KEYS
} from './constants.js';

class SettingsManager {
    constructor() {
        this.initializeDefaults();
    }

    /**
     * デフォルト値で初期化
     * @private
     */
    initializeDefaults() {
        this.whitelist = [];
        this.runOnStartup = DEFAULT_SETTINGS.RUN_ON_STARTUP;
        this.runOnClose = DEFAULT_SETTINGS.RUN_ON_CLOSE;
        this.removeDownloads = DEFAULT_SETTINGS.REMOVE_DOWNLOADS;
        this.removeFormData = DEFAULT_SETTINGS.REMOVE_FORMDATA;
        this.removeHistory = DEFAULT_SETTINGS.REMOVE_HISTORY;
        this.removeCookies = DEFAULT_SETTINGS.REMOVE_COOKIES;
        this.removeCacheAndStorage = DEFAULT_SETTINGS.REMOVE_CACHE_AND_STORAGE;
    }

    /**
     * ストレージから設定を非同期で読み込む
     * @returns {Promise<void>}
     */
    async load() {
        try {
            const keys = Object.values(STORAGE_KEYS);
            const result = await chrome.storage.local.get(keys);

            this.applyLoadedSettings(result);
            this.logLoadedSettings();
        } catch (error) {
            Logger.error('設定の読み込みエラー:', error);
            throw error;
        }
    }

    /**
     * 読み込んだ設定を適用
     * @param {Object} result - ストレージから取得した結果
     * @private
     */
    applyLoadedSettings(result) {
        try {
            this.whitelist = result[STORAGE_KEYS.WHITELIST] ?? [];
            this.runOnStartup = result[STORAGE_KEYS.RUN_ON_STARTUP] ?? DEFAULT_SETTINGS.RUN_ON_STARTUP;
            this.runOnClose = result[STORAGE_KEYS.RUN_ON_CLOSE] ?? DEFAULT_SETTINGS.RUN_ON_CLOSE;
            this.removeDownloads = result[STORAGE_KEYS.REMOVE_DOWNLOADS] ?? DEFAULT_SETTINGS.REMOVE_DOWNLOADS;
            this.removeFormData = result[STORAGE_KEYS.REMOVE_FORMDATA] ?? DEFAULT_SETTINGS.REMOVE_FORMDATA;
            this.removeHistory = result[STORAGE_KEYS.REMOVE_HISTORY] ?? DEFAULT_SETTINGS.REMOVE_HISTORY;
            this.removeCookies = result[STORAGE_KEYS.REMOVE_COOKIES] ?? DEFAULT_SETTINGS.REMOVE_COOKIES;
            this.removeCacheAndStorage = result[STORAGE_KEYS.REMOVE_CACHE_AND_STORAGE] ?? DEFAULT_SETTINGS.REMOVE_CACHE_AND_STORAGE;
        } catch (error) {
            Logger.error('設定適用エラー:', error);
            throw error;
        }
    }

    /**
     * 読み込んだ設定をログ出力
     * @private
     */
    logLoadedSettings() {
        Logger.debug('設定を読み込みました:', {
            whitelistCount: this.whitelist.length,
            runOnStartup: this.runOnStartup,
            runOnClose: this.runOnClose,
            removeDownloads: this.removeDownloads,
            removeFormData: this.removeFormData,
            removeHistory: this.removeHistory,
            removeCookies: this.removeCookies,
            removeCacheAndStorage: this.removeCacheAndStorage
        });
    }

    /**
     * ドメインごとのフラグに基づいて除外するオリジンリストを生成
     * @param {string} flagName - フラグ名（WHITELIST_KEYS.KEEP_COOKIES または WHITELIST_KEYS.KEEP_CACHE）
     * @returns {Array<string>} オリジンの配列
     */
    getOriginsByFlag(flagName) {
        try {
            return this.whitelist
                .filter(entry => entry[flagName] === 1)
                .flatMap(entry => {
                    const domain = entry[WHITELIST_KEYS.DOMAIN].trim();
                    return [`https://${domain}`, `http://${domain}`];
                });
        } catch (error) {
            Logger.error('オリジンリスト生成エラー:', error);
            return [];
        }
    }

    /**
     * 設定のログ出力
     */
    logSettings() {
        Logger.debug('現在の設定:', this.toObject());
    }

    /**
     * 設定をオブジェクトとして取得
     * @returns {Object}
     */
    toObject() {
        return {
            whitelist: this.whitelist,
            runOnStartup: this.runOnStartup,
            runOnClose: this.runOnClose,
            removeDownloads: this.removeDownloads,
            removeFormData: this.removeFormData,
            removeHistory: this.removeHistory,
            removeCookies: this.removeCookies,
            removeCacheAndStorage: this.removeCacheAndStorage
        };
    }
}

export { SettingsManager };
