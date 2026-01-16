/**
 * @file シンプルなログ管理
 * @description 小規模開発向けの軽量ログシステム
 */

class Logger {
    static prefix = `[${chrome.runtime.getManifest().name}]`;
    
    /**
     * 本番環境かどうか
     * @returns {boolean}
     */
    static isProduction() {
        return !!chrome.runtime.getManifest().update_url;
    }
    
    /**
     * 開発環境でのみ実行
     * console を直接バインドして呼び出し元情報を保持
     */
    static debug = Logger.isProduction() 
        ? () => {} 
        : console.log.bind(console, Logger.prefix);
    
    static info = Logger.isProduction() 
        ? () => {} 
        : console.info.bind(console, Logger.prefix);
    
    static warn = Logger.isProduction() 
        ? () => {} 
        : console.warn.bind(console, Logger.prefix);
    
    /**
     * 常に実行（本番環境でも出力）
     */
    static error = console.error.bind(console, Logger.prefix);
}

export { Logger };
