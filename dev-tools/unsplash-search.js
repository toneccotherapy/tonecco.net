#!/usr/bin/env node

import { createApi } from 'unsplash-js';
import { ProxyAgent } from 'undici';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESモジュールでの__dirnameの取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数が設定されていない場合のみ .env.local を読み込む
// システム環境変数を優先、なければ .env.local から読み込む
if (!process.env.UNSPLASH_ACCESS_KEY) {
  config({ path: join(__dirname, '..', '.env.local') });
}

/**
 * Unsplash画像検索クラス
 */
class UnsplashImageSearch {
  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!this.accessKey) {
      console.error('❌ Error: UNSPLASH_ACCESS_KEY not found in .env.local');
      console.error('📝 Please create .env.local file with your Unsplash API key');
      console.error('📖 See .env.local.example for reference');
      process.exit(1);
    }

    // プロキシ設定を取得
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                     process.env.HTTP_PROXY || process.env.http_proxy;

    // カスタムfetchを設定（プロキシサポート付き）
    const customFetch = proxyUrl
      ? (url, options) => {
          return fetch(url, {
            ...options,
            dispatcher: new ProxyAgent(proxyUrl)
          });
        }
      : undefined;

    this.unsplash = createApi({
      accessKey: this.accessKey,
      fetch: customFetch,
    });
  }

  /**
   * 画像を検索してURL を返す
   * @param {string} query 検索キーワード
   * @param {number} width 画像幅（デフォルト: 800）
   * @param {number} quality 画像品質（デフォルト: 80）
   * @returns {Promise<string>} 最適化された画像URL
   */
  async searchImage(query, width = 800, quality = 80) {
    try {
      console.log(`🔍 Searching for: "${query}"`);
      
      const result = await this.unsplash.search.getPhotos({
        query,
        page: 1,
        perPage: 10,
        orientation: 'landscape',
      });

      if (result.errors) {
        console.error('❌ API Error:', result.errors);
        return this.getFallbackImageUrl(query, width, quality);
      }

      const photos = result.response.results;
      
      if (!photos || photos.length === 0) {
        console.log(`⚠️  No images found for "${query}"`);
        return this.getFallbackImageUrl(query, width, quality);
      }

      // 最初の画像を選択（通常は最も関連性が高い）
      const selectedPhoto = photos[0];
      
      // 最適化されたURLを生成
      const optimizedUrl = `${selectedPhoto.urls.raw}&w=${width}&q=${quality}&fm=webp&fit=crop`;
      
      console.log(`✅ Found image by ${selectedPhoto.user.name}`);
      console.log(`📸 Image URL: ${optimizedUrl}`);
      
      // ダウンロード追跡（Unsplash API規約に準拠）
      if (selectedPhoto.links.download_location) {
        try {
          await this.unsplash.photos.trackDownload({
            downloadLocation: selectedPhoto.links.download_location,
          });
        } catch (trackError) {
          console.warn('⚠️  Could not track download:', trackError.message);
        }
      }
      
      return optimizedUrl;
      
    } catch (error) {
      console.error('❌ Search failed:', error.message);
      return this.getFallbackImageUrl(query, width, quality);
    }
  }

  /**
   * フォールバック画像URLを生成
   * @param {string} query 検索キーワード
   * @param {number} width 画像幅
   * @param {number} quality 画像品質
   * @returns {string} フォールバック画像URL
   */
  getFallbackImageUrl(query, width, quality) {
    console.log(`🔄 Using fallback image for "${query}"`);
    // source.unsplash.com はサービス停止のため、ダミー画像を使用
    return 'https://www.claude-webmaster.jp/images/dummy.jpg';
  }

  /**
   * 複数の画像を取得
   * @param {string[]} queries 検索キーワードの配列
   * @param {number} width 画像幅
   * @param {number} quality 画像品質
   * @returns {Promise<Object>} キーワードとURLのマップ
   */
  async searchMultipleImages(queries, width = 800, quality = 80) {
    const results = {};
    
    for (const query of queries) {
      results[query] = await this.searchImage(query, width, quality);
      // レート制限を回避するため少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }
}

/**
 * コマンドライン実行部分
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Usage:');
    console.log('  node unsplash-search.js "search keyword"');
    console.log('  node unsplash-search.js "keyword1,keyword2,keyword3"');
    console.log('');
    console.log('🎯 Examples:');
    console.log('  node unsplash-search.js "business team"');
    console.log('  node unsplash-search.js "technology,innovation,startup"');
    process.exit(1);
  }

  const searcher = new UnsplashImageSearch();
  
  const input = args[0];
  const keywords = input.includes(',') 
    ? input.split(',').map(k => k.trim())
    : [input.trim()];

  try {
    if (keywords.length === 1) {
      // 単一キーワード検索
      const imageUrl = await searcher.searchImage(keywords[0]);
      console.log('\n🎉 Result:');
      console.log(imageUrl);
    } else {
      // 複数キーワード検索
      console.log(`🔍 Searching for ${keywords.length} images...`);
      const results = await searcher.searchMultipleImages(keywords);
      
      console.log('\n🎉 Results:');
      for (const [keyword, url] of Object.entries(results)) {
        console.log(`${keyword}: ${url}`);
      }
    }
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain()を呼び出し
// ESモジュールでの実行判定（より確実な方法）
const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href ||
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1]?.includes('unsplash-search.js');

if (isMainModule) {
  main();
}

export { UnsplashImageSearch };