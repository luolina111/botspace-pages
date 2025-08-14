import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import './App.css';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是基于 OpenAI GPT 的AI助手，有什么可以帮助你的吗？',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 调用 OpenAI API
  const callOpenAI = async (userMessage: string): Promise<string> => {
    // if (!apiKey.trim()) {
    //   throw new Error('请先设置 OpenAI API Key');
    // }

    const response = await fetch('https://api.botspace.site/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query Ask($prompt: String!) { ask(prompt: $prompt) }`,
        variables: { prompt: input.trim() },
      }),
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '抱歉，我没有收到有效的回复。';
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const aiResponse = await callOpenAI(input.trim());
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: aiResponse, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      setError(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 清空聊天
  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
        role: 'assistant',
        timestamp: new Date(),
      }
    ]);
    setError(null);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      {/* 头部 */}
      <header className="header">
        <div className="header-title">
          <h1>AI 聊天助手</h1>
          <p>基于 OpenAI GPT-3.5</p>
        </div>
        <div className="header-actions">
          {/* <button 
            onClick={() => setShowSettings(true)}
            className="icon-button"
            title="设置"
          >
            <Settings size={18} />
          </button> */}
          <button 
            onClick={clearChat}
            className="icon-button"
            title="清空聊天"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      {/* 消息列表 */}
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">
                  {message.role === 'user' ? '你' : 'AI助手'}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-text">
                {message.isLoading ? (
                  <span className="loading">正在思考...</span>
                ) : (
                  message.content
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          className="input"
          rows={1}
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          <Send size={18} />
        </button>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>设置</h2>
            <div className="form-group">
              <label>OpenAI API Key</label>
              <div className="input-wrapper">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="api-input"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="toggle-button"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small>API Key 仅保存在本地，不会上传到服务器</small>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSettings(false)} className="button-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;