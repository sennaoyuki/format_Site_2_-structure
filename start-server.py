#!/usr/bin/env python3
"""
クリニックランキングサイト用HTTPサーバー
publicディレクトリをルートとして提供します
"""

import http.server
import socketserver
import os
import sys

# サーバー設定
PORT = 8000
DIRECTORY = "public"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # CORSヘッダーを追加（開発用）
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # ディレクトリの存在確認
    if not os.path.exists(DIRECTORY):
        print(f"エラー: '{DIRECTORY}' ディレクトリが見つかりません")
        sys.exit(1)
    
    # サーバー起動
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 サーバーを起動しました")
        print(f"📁 提供ディレクトリ: {os.path.abspath(DIRECTORY)}")
        print(f"🌐 URL: http://localhost:{PORT}")
        print(f"🔗 地域別URL例:")
        print(f"   - 東京: http://localhost:{PORT}/?region_id=013")
        print(f"   - 大阪: http://localhost:{PORT}/?region_id=027")
        print(f"   - 埼玉: http://localhost:{PORT}/?region_id=011")
        print(f"\n終了するには Ctrl+C を押してください")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 サーバーを停止しました")

if __name__ == "__main__":
    main()