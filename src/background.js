/**
 * @file このアプリのメインスクリプト
 * @description 各コンポーネントを初期化し、アプリケーションを起動
 */

console.log(`[${chrome.runtime.getManifest().name}] backgroundスクリプト読み込み開始`);

import { Logger } from './logger.js';

import { SettingsManager } from './settingsManager.js';
Logger.info('SettingsManager インポート完了');

import { DataCleaner } from './dataCleaner.js';
Logger.info('DataCleaner インポート完了');

import { EventHandler } from './eventHandler.js';
Logger.info('EventHandler インポート完了');

// グローバルインスタンス
const settingsManager = new SettingsManager();
const dataCleaner = new DataCleaner(settingsManager);
const eventHandler = new EventHandler(settingsManager, dataCleaner);

// イベントリスナーを登録
Logger.info('イベントリスナー登録中...');

// ポップアップからのメッセージを受信するイベント
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    Logger.info('メッセージ受信:', request);
    return eventHandler.handleMessage(request, sender, sendResponse);
});

// ブラウザ終了時自動削除のためのウィンドウクローズイベント
chrome.windows.onRemoved.addListener(async (windowId) => {
    try {
        Logger.info('ウィンドウクローズを検知（ID:', windowId, '）');
        await eventHandler.handleWindowCloseEvent(windowId);
    } catch (error) {
        Logger.error('ウィンドウクローズリスナーエラー:', error);
    }
});

// ブラウザ起動時自動削除のための起動時イベント
chrome.runtime.onStartup.addListener(async () => {
    Logger.info('ブラウザ起動を検知');
    await loadSettings();

    Logger.info('ブラウザ起動時自動削除を実行中...');
    await eventHandler.handleStartupIfNeeded();
    Logger.info('ブラウザ起動時自動削除の完了');
});

// 拡張機能のインストール/更新時のイベント
chrome.runtime.onInstalled.addListener(() => {
    Logger.info('拡張機能のインストール/更新を検知');
    loadSettings();
});

Logger.info('イベントリスナー登録完了');

/**
 * 設定の読み込み
 */
async function loadSettings() {
    try {
        Logger.info('設定読み込み中...');
        await settingsManager.load();
        settingsManager.logSettings();
        Logger.info('設定読み込み完了');
    } catch (error) {
        Logger.error('設定の読み込みに失敗:', error);
    }
}

