import { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { logger } from '../utils/logger';
import { Terminal, X, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function LogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    setLogs(logger.getLogs());
    return unsubscribe;
  }, []);

  function getLevelColor(level: LogEntry['level']): string {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  }

  function getLevelIcon(level: LogEntry['level']): string {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
    }
  }

  function copyLogs() {
    const text = logger.exportLogs();
    navigator.clipboard.writeText(text);
    alert('로그가 클립보드에 복사되었습니다.');
  }

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.level === filter);

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 z-40 flex items-center space-x-2"
        title="로그 보기"
      >
        <Terminal className="w-5 h-5" />
        {logs.length > 0 && (
          <span className="bg-white text-primary-600 text-xs font-bold rounded-full px-2 py-0.5">
            {logs.length}
          </span>
        )}
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* 로그 패널 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[600px] max-w-[calc(100vw-3rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-40">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">시스템 로그</h3>
              <span className="text-sm text-gray-500">({filteredLogs.length})</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 필터 */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">전체</option>
                <option value="info">정보</option>
                <option value="success">성공</option>
                <option value="warning">경고</option>
                <option value="error">에러</option>
              </select>

              <button
                onClick={copyLogs}
                className="p-1 hover:bg-gray-200 rounded"
                title="로그 복사"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
              
              <button
                onClick={() => {
                  if (confirm('모든 로그를 삭제하시겠습니까?')) {
                    logger.clearLogs();
                  }
                }}
                className="p-1 hover:bg-red-100 rounded"
                title="로그 삭제"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 로그 목록 */}
          <div className="h-96 overflow-y-auto p-2 space-y-1 bg-gray-900 text-gray-100 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                로그가 없습니다
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 shrink-0">
                      {formatDate(log.timestamp, 'HH:mm:ss')}
                    </span>
                    
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)} {log.level.toUpperCase()}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{log.action}</div>
                      
                      {log.details && (
                        <div className="text-gray-400 mt-1">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                      
                      {log.error && (
                        <div className="text-red-400 mt-1">
                          ❌ {log.error}
                        </div>
                      )}
                      
                      {log.stackTrace && (
                        <details className="mt-1 text-gray-500">
                          <summary className="cursor-pointer hover:text-gray-300">
                            스택 트레이스 보기
                          </summary>
                          <pre className="mt-1 text-xs overflow-x-auto">
                            {log.stackTrace}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

