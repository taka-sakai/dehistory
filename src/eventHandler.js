/**
 * @file イベントハンドラークラス
 * @description Chrome拡張機能のイベントリスナーを管理
 */

import { Logger } from './logger.js';
import { SettingsManager } from './settingsManager.js';
import { DataCleaner } from './dataCleaner.js';

class EventHandler {
    /**
     * @param {SettingsManager} settingsManager
     * @param {DataCleaner} dataCleaner
     */
    constructor(settingsManager, dataCleaner) {
        /** @type {SettingsManager} */
        this.settings = settingsManager;
        /** @type {DataCleaner} */
        this.cleaner = dataCleaner;
    }

    /**
     * 起動時削除が必要かチェックして実行
     * @public
     */
    async handleStartupIfNeeded() {
        try {
            // セッションストレージから起動時削除の実行状態を確認
            const result = await chrome.storage.session.get('startupCleanExecuted');
            
            if (result.startupCleanExecuted) {
                Logger.info('起動時削除は既に実行済みです（Service Worker再起動のためスキップ）');
                return;
            }

            if (this.settings.runOnStartup) {
                Logger.info('起動時データ削除を実行します');
                await this.cleaner.clearAll();
                
                // 実行済みフラグをセッションストレージに保存
                await chrome.storage.session.set({ startupCleanExecuted: true });
                Logger.info('起動時削除完了 - 実行済みフラグを設定しました');
            } else {
                Logger.debug('起動時実行は無効です（設定でスキップ）');
            }
        } catch (error) {
            Logger.error('起動時処理でエラーが発生しました:', error);
        }
    }

    /**
     * メッセージの処理
     * @param {Object} request
     * @param {Object} sender
     * @param {Function} sendResponse
     * @returns {boolean}
     * @public
     */
    handleMessage(request, sender, sendResponse) {
        try {
            // セキュリティチェック
            if (!this.isValidSender(sender)) {
                Logger.error('不正な送信元からのメッセージを拒否しました:', sender);
                sendResponse({ success: false, error: 'Unauthorized' });
                return false;
            }

            // アクション処理
            if (request.action === 'deleteData') {
                Logger.info('ポップアップからデータ削除リクエストを受信しました');
                this.handleDeleteDataRequest(sendResponse);
                return true; // 非同期レスポンス
            }

            Logger.warn('未知のアクション:', request.action);
            return false;
        } catch (error) {
            Logger.error('メッセージ処理エラー:', error);
            sendResponse({ success: false, error: error.message });
            return false;
        }
    }

    /**
     * 送信元の妥当性をチェック
     * @param {Object} sender
     * @returns {boolean}
     * @private
     */
    isValidSender(sender) {
        return sender.id && sender.id === chrome.runtime.id;
    }

    /**
     * データ削除リクエストの処理
     * @param {Function} sendResponse
     * @private
     */
    handleDeleteDataRequest(sendResponse) {
        try {
            // 非同期処理を実行
            this.cleaner.clearAll()
                .then(() => {
                    sendResponse({ success: true });
                    Logger.info('データ削除リクエストの処理が完了しました');
                })
                .catch((error) => {
                    Logger.error('データ削除リクエストの処理でエラー:', error);
                    sendResponse({ success: false, error: error.message });
                });
        } catch (error) {
            Logger.error('データ削除リクエスト処理エラー:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * ウィンドウクローズイベントの処理
     * @param {number} closedWindowId - 閉じられたウィンドウのID
     * @public
     */
    async handleWindowCloseEvent(closedWindowId) {
        try {
            await this.settings.load();
            
            if (!this.settings.runOnClose) {
                Logger.debug('終了時実行は無効です（設定でスキップ）');
                return;
            }

            const isLastWindow = await this.checkIfLastWindow(closedWindowId);
            
            if (isLastWindow) {
                Logger.info('最後のウィンドウが閉じられました。データを削除します');
                await this.cleaner.clearAll();
            } else {
                Logger.debug('他のウィンドウが残っています（削除スキップ）');
            }
        } catch (error) {
            Logger.error('ウィンドウクローズ処理でエラー:', error);
        }
    }

    /**
     * 最後のウィンドウかどうかをチェック
     * @param {number} closedWindowId - 閉じられたウィンドウのID
     * @returns {Promise<boolean>}
     * @private
     */
    async checkIfLastWindow(closedWindowId) {
        // onRemovedイベント時点では、閉じられたウィンドウが既にリストから削除されている
        // そのため、残りのウィンドウ数が0であれば最後のウィンドウだったと判定
        const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
        const isLast = !windows || windows.length === 0;
        
        Logger.debug(isLast ? 'これが最後のウィンドウです' : `残りウィンドウ数: ${windows.length}`);
        return isLast;
    }
}

export { EventHandler };
