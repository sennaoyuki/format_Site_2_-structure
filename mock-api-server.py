#!/usr/bin/env python3

"""
モックAPIサーバー
作成者: Worker3
作成日時: 2025-07-17 12:22
用途: Worker2の実装完了前の統合テスト準備用
"""

import json
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

class MockAPIHandler(BaseHTTPRequestHandler):
    """モックAPIハンドラー"""
    
    def do_GET(self):
        """GETリクエストハンドラー"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/admin/api/health':
            self.send_health_check()
        elif parsed_path.path == '/admin/api/backup/list':
            self.send_backup_list()
        else:
            self.send_error(404, 'Not Found')
    
    def do_POST(self):
        """POSTリクエストハンドラー"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/admin/api/upload':
            self.handle_upload()
        elif parsed_path.path == '/admin/api/validate':
            self.handle_validate()
        elif parsed_path.path == '/admin/api/save':
            self.handle_save()
        elif parsed_path.path == '/admin/api/backup/create':
            self.handle_backup_create()
        elif parsed_path.path == '/admin/api/backup/restore':
            self.handle_backup_restore()
        else:
            self.send_error(404, 'Not Found')
    
    def send_health_check(self):
        """ヘルスチェックレスポンス"""
        response = {
            'status': 'healthy',
            'timestamp': time.time(),
            'version': '1.0.0-mock'
        }
        self.send_json_response(200, response)
    
    def handle_upload(self):
        """ファイルアップロードハンドラー"""
        # 簡易的なファイルアップロード処理
        content_length = int(self.headers.get('Content-Length', 0))
        
        # 10MB制限チェック
        if content_length > 10 * 1024 * 1024:
            self.send_json_response(413, {
                'error': 'File too large',
                'message': 'ファイルサイズが10MBを超えています'
            })
            return
        
        # 成功レスポンス
        response = {
            'status': 'success',
            'message': 'ファイルがアップロードされました',
            'file_id': f'file_{int(time.time())}',
            'size': content_length
        }
        
        # 処理時間のシミュレーション
        time.sleep(0.5)
        self.send_json_response(200, response)
    
    def handle_validate(self):
        """データ検証ハンドラー"""
        response = {
            'status': 'success',
            'validation_result': {
                'errors': [],
                'warnings': [],
                'info': {
                    'total_files': 5,
                    'total_records': 1234,
                    'validation_time': 0.123
                }
            }
        }
        
        # 検証処理のシミュレーション
        time.sleep(0.3)
        self.send_json_response(200, response)
    
    def handle_save(self):
        """データ保存ハンドラー"""
        response = {
            'status': 'success',
            'message': 'データが保存されました',
            'saved_at': time.time(),
            'files_saved': 5
        }
        
        # 保存処理のシミュレーション
        time.sleep(1.0)
        self.send_json_response(200, response)
    
    def handle_backup_create(self):
        """バックアップ作成ハンドラー"""
        backup_id = f'backup_{int(time.time())}'
        response = {
            'status': 'success',
            'backup_id': backup_id,
            'created_at': time.time(),
            'size': 1024 * 512  # 512KB
        }
        
        # バックアップ処理のシミュレーション
        time.sleep(0.8)
        self.send_json_response(200, response)
    
    def handle_backup_restore(self):
        """バックアップ復元ハンドラー"""
        response = {
            'status': 'success',
            'message': 'バックアップから復元しました',
            'restored_at': time.time()
        }
        
        # 復元処理のシミュレーション
        time.sleep(1.2)
        self.send_json_response(200, response)
    
    def send_backup_list(self):
        """バックアップリスト送信"""
        response = {
            'status': 'success',
            'backups': [
                {
                    'id': 'backup_1234567890',
                    'created_at': time.time() - 3600,
                    'size': 1024 * 512,
                    'file_count': 5
                },
                {
                    'id': 'backup_1234567000',
                    'created_at': time.time() - 7200,
                    'size': 1024 * 480,
                    'file_count': 5
                }
            ]
        }
        self.send_json_response(200, response)
    
    def send_json_response(self, status_code, data):
        """JSONレスポンス送信"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """OPTIONSリクエストハンドラー（CORS対応）"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """ログメッセージのカスタマイズ"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_mock_server(port=8003):
    """モックサーバー起動"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockAPIHandler)
    
    print(f"""
=========================================
    モックAPIサーバー起動
=========================================
ポート: {port}
URL: http://localhost:{port}/admin/api/

エンドポイント:
- GET  /admin/api/health        - ヘルスチェック
- POST /admin/api/upload        - ファイルアップロード
- POST /admin/api/validate      - データ検証
- POST /admin/api/save          - データ保存
- POST /admin/api/backup/create - バックアップ作成
- POST /admin/api/backup/restore - バックアップ復元
- GET  /admin/api/backup/list   - バックアップリスト

Ctrl+C で終了
=========================================
    """)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nモックサーバーを停止しています...')
        httpd.shutdown()
        print('モックサーバーが停止しました。')

if __name__ == '__main__':
    run_mock_server()