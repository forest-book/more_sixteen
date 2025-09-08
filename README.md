# More Sixteen - MBTI対話診断アプリケーション

このアプリケーションは、ユーザーが自身のMBTIタイプを選択し、AIとの対話を通じて自己理解を深めるためのWebアプリケーションです。

## 概要

ユーザーはまず4つの指標（E/I, N/S, T/F, J/P）から自身のMBTIタイプを選択します。その後、AIとのチャットが開始されます。10ターンの対話を通じて、AIはユーザーの応答を分析し、最終的にユーザーの「真のMBTIタイプ」とその判断理由を提示します。

## ディレクトリ構成

web-demo
├── app.py          # Flaskバックエンドサーバー
├── index.html      # フロントエンドのメインページ
├── style.css       # スタイルシート
└── script.js       # フロントエンドのJavaScriptロジック

## 依存関係

本アプリケーションを実行するには、以下の環境とライブラリが必要です。

### フロントエンド

-   Webブラウザ
-   [Google Fonts (Montserrat, Roboto, Cookie)](https://fonts.google.com/)
-   [Font Awesome](https://fontawesome.com/)

※ 上記は`index.html`内でCDN経由で読み込まれるため、個別のインストールは不要です。

### バックエンド (Python)

-   Python 3.x
-   Flask
-   requests

以下のコマンドで必要なPythonライブラリをインストールしてください。

```bash
pip install Flask requests

