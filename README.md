# Claude1page

Claude Code を使って、シンプルで、モダンで、美しい、ワンページで完結するWebページを作るためのスターターキットです。Cloudflare Pagesで簡単に公開できるように設計されています。

## 更新履歴

- 2025年 12月26日:
  - .gitignore に、`.playwright-mcp` 一時フォルダを追加し、リポジトリから除外されるようにした
- 2025年 12月23日:
  - TailwindCSS v4.1 の設定をより確実に行われるように、CLAUDE.md を修正
  - ナビゲーションがより確実に実装されやすいように技術仕様、デザインについての方針を明確に記述(CLAUDE.md)
- 2025年 11月26日:
  - Claude Code on the Web (Sandbox)では、Unsplashの画像検索ができない問題を解決（Proxyを使うように修正）
  - 画像検索のフォールバックが、フォールバックになっていない（エラーする画像URL）ので、独自で用意したダミー画像URLを指定するようにした（ https://www.claude-webmaster.jp/images/dummy.jpg )
- 2025年 11月 5日:
  - scripts/install_pkg.sh をローカルでは実行しない（Claude Code on the Webでは実行）ように設定
  - scripts/install_pkg.sh に実行権限を与えるように初期設定のガイドを修正
- 2025年 10月 27日:
  - `.rgignore` を使って、prompt.md などを検索対象除外から除外（これで、Claude Code で @ で指定できるようになった）
  - README.md を Cloudflareの説明などに変更（Unsplashの設定も推奨に設定、環境変数対応についても記載など）

**アップデート方法は、末尾をご覧ください**

## 必要なサービスと準備

- **Claude Code の事前インストール** （Cloude Code on the Web でも動作します）
- **Nodeのインストール**
- **Visual Studio Code**
  - **おすすめの拡張機能**
  	- Claude Code
    - Live Server
    - Prettier - Code formatter
- [Github.com](https://github.com/)
- Gitのインストールと設定
- [Cloudflare](https://www.cloudflare.com/ja-jp/)
- [Unsplash開発者登録](https://unsplash.com/oauth/applications)

### Unsplash API キーの設定（環境変数に設定）

**APIキーの取得方法：**
1. [Unsplash Developers](https://unsplash.com/developers) にアクセス
2. "Register as a developer" でアカウント登録
3. "New Application" で新しいアプリケーションを作成
4. Access Key を取得

環境変数に設定する場合は、以下のようなコマンド（here-is-your-keyを書き換えた上で）を実行します。

macOSの場合
```zsh
echo 'export UNSPLASH_ACCESS_KEY=here-is-your-key' >> ~/.zshrc && source ~/.zshrc
```

Windowsの場合（PowerShellで実行）
```powershell
if (!(Test-Path $PROFILE)) { New-Item -Path $PROFILE -ItemType File -Force }; Add-Content -Path $PROFILE -Value '$env:UNSPLASH_ACCESS_KEY="here-is-your-key"'; . $PROFILE
```

あるいは、APIキー設定用のファイルを作成し、中身を編集してください。見ればわかります。
cp .env.local.example .env.local

## 準備

1. **リポジトリからクローン**
      
   フォルダを作る
   ```bash
   mkdir project-name
   ```
   フォルダに移動
   ```bash
   cd project-name
   ```
   
   フォルダ内でリポジトリをクローン（展開する）
   ```bash
   git clone https://github.com/toiee-lab/claude1page.git .
   ```

2. **リポジトリの初期化と、セットアップスクリプトの実行権限与える**
   ```bash
   rm -rf .git
   git init
   chmod +x scripts/install_pkg.sh
   npm install
   ```

3. **Unsplashで画像が検索できるかテストする**
   以下のコマンドでテストしてください。

   ```bash
   npm run search "hello"
   ```

以上で完了です。

## ポイント

- **プロンプトファイルの活用**
  - `prompt.md` や `prompt2.md` などのファイルを作って、プロンプトを書いてコピペすると便利です（gitに保存されません）
  - あるいは、 prompt.md にプロンプトを書き込み、保存し、 `@prompt.md` で呼び出しても良いです

- **コンテンツの管理**
  - `project-docs` ディレクトリに、コンテキストコンテンツなどを保管して、呼び出すと便利です

- **画像の自動取得**
  - Unsplash APIを設定すると、Claude Codeが自動で高品質な画像を検索・取得します
  - 手動で画像を探す手間が省けて、作業効率が大幅に向上します
  - 取得される画像は最適化済み（WebP形式、適切なサイズ）で、ページの読み込み速度も向上します

## プロンプト例

```
Webページを作成してください。

- ここにありったけ、情報を書いてください
- どんなデザインが良いのか？
- もし、カラーが決まっているなら指定する
- 誰向けのものなのか？
- あなたが伝えたいこと、あなたの強み、特徴など
- お店の名前や、プロダクトについての説明など
- 難しく考えず、たくさん書いて、あとはClaudeに任せましょう
```

## ファイル構成

```
claude1page/
├── public/              # Cloudflare Pages 公開用ディレクトリ
│   ├── index.html      # メインページ
│   └── assets/         # CSS、JS、画像などの静的ファイル
├── project-docs/       # プロジェクト関連ドキュメント
├── dev-tools/          # 画像検索ツール（オプション）
│   ├── package.json
│   ├── unsplash-search.js
│   └── README.md
├── CLAUDE.md          # Claude Code用の指示書
├── .env.local.example # API設定テンプレート
└── README.md          # このファイル
```

## Cloudflare Pagesでの公開

1. Cloudflareにログイン
2. コンピューティングとAI > Workers & Pages を選択
3. アプリケーションを作成 > Pagesタブ をクリック
4. 既存のGitリポジトリをインポートするを選び、リポジトリを選ぶ
5. 公開フォルダに、 `public` を設定する
6. Deploy
7. その後、必要に応じて、カスタムドメインなどを設定する

※ Cloudflare でドメインを管理すれば、すごく簡単にできるようになります

## アップデート方法

このテンプレートリポジトリから作成した新しいリポジトリには、自動でアップデートはされません（通知も）。

ほとんど、アップデートされることはありませんが、時々、Claude Code の新しい機能に対応させるために、アップデートを行うことがあります。例えば、Claude Code on the Web で動作させたい場合は、アップデートさせる必要があります。手順は、以下の通りです。

### (1) スクリプトを実行

ターミナルを開いて、以下を実行してください。

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/toiee-lab/claude1page/main/CLAUDE.md
curl -o .claude/settings.json  https://raw.githubusercontent.com/toiee-lab/claude1page/main/.claude/settings.json
curl -o .rgignore  https://raw.githubusercontent.com/toiee-lab/claude1page/main/.rgignore
curl -o dev-tools/unsplash-search.js  https://raw.githubusercontent.com/toiee-lab/claude1page/main/dev-tools/unsplash-search.js
curl -o package.json  https://raw.githubusercontent.com/toiee-lab/claude1page/main/package.json
curl -o package-lock.json  https://raw.githubusercontent.com/toiee-lab/claude1page/main/package-lock.json
mkdir scripts
curl -o scripts/install_pkgs.sh  https://raw.githubusercontent.com/toiee-lab/claude1page/main/scripts/install_pkgs.sh
chmod +x scripts/install_pkgs.sh
npm install
```

### (2) 変更点をチェック

ソースコード管理などで、変更されたファイルをチェックしてください。もし、あなたが意図的に変更したものを上書きしているなら、以前のものと今のものを比較しながら、調整してください。

特に、 **CLAUDE.md ファイルをカスタマイズしている場合は、ご自身の変更を再反映** してください。
