import { useEffect, useState } from 'react'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [sendError, setSendError] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Loading of dynamic elements on mount
  useEffect(() => {
    let isMounted = true

    // Load chat titles in the chat history box
    const loadChats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/chats/get-chats')
        if (response.ok) {
          const data = await response.json()
          let newChats = data.chats.map(chat => {
            return {
              id: chat.uuid,
              title: chat.title,
              date: new Date(parseFloat(chat.timestamp)).toLocaleString()
            }
          })
          setChatHistory(newChats)
        }
      }
      catch (err) {
        console.log('Error loading chats from API', err)
      }
    }

    // Check the status of the API and update element respectively
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/health')
        if (response.ok && isMounted) {
          setConnectionStatus('online')
          loadChats()
        }
      } catch (error) {
        if (isMounted) {
          setConnectionStatus('connecting')
        }
      }
    }
    checkHealth()

    return () => {
      isMounted = false
    }
  }, [])

  // Load existing messages within a chats history if a id is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get('chat')
    if (!chatId) return

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/chats/get-messages?chat=${encodeURIComponent(
            chatId,
          )}`,
        )
        if (!response.ok) return
        const data = await response.json()
        const hydrated = data.messages.map((message, index) => ({
          id: message.uuid ?? `${chatId}-${index}`,
          source: message.source,
          content: message.content,
          time: new Date(parseFloat(message.timestamp)).toLocaleString()
        }))
        setMessages(hydrated)
      } catch (error) {
        console.log('Error loading messages from API', error)
      }
    }

    loadMessages()
  }, [])

  // Send a message to the backend
  // Seperate processing for new chat or just send message
  const sendMessage = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get('chat')

    const nextMessage = {
      id: Date.now(),
      source: 'user',
      content: trimmed,
      time: new Date().toLocaleString()
    }

    setMessages((prev) => [...prev, nextMessage])
    setInput('')
    setSendError('')
    setIsSending(true)
    setIsTyping(true)

    if (chatId) {

    }
    else {
      try {
        const response = await fetch('http://localhost:3001/api/chats/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: trimmed }),
        })

        if (response.status !== 201) {
          throw new Error('Unexpected response')
        }

        const payload = await response.json()
        const chatId = payload?.uuid

        if (!chatId) {
          throw new Error('Missing chat id')
        }

        window.location.assign(
          `http://localhost:5173/?chat=${encodeURIComponent(chatId)}`,
        )
      } catch (error) {
        setSendError(
          'We could not start a new chat. Please check the server and try again.',
        )
        setIsSending(false)
        setIsTyping(false)
      }
    }
    
  }

  const openChat = (chatId) => {
    if (!chatId) return
    window.location.assign(
      `http://localhost:5173/?chat=${encodeURIComponent(chatId)}`,
    )
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden text-[color:var(--ink-100)]">
      <div className="pointer-events-none absolute -left-36 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,#ffe6b3_0%,rgba(255,230,179,0)_70%)] opacity-35" />
      <div className="pointer-events-none absolute -bottom-36 -right-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,#a9e7ff_0%,rgba(169,231,255,0)_70%)] opacity-35" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-6 px-12 pb-6 pt-8">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-gradient-to-br from-[#101820] to-[#283341] text-lg font-bold tracking-[0.04em] text-[#f4efe7] shadow-[0_12px_30px_rgba(15,18,20,0.12)]">
            G
          </div>
          <div>
            <p className="text-lg font-semibold">Glyphic Agent</p>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-60)]">
              The Salesman in your pocket.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[color:var(--ink-80)]">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connectionStatus === 'online'
                ? 'bg-[#2bd96b] shadow-[0_0_12px_rgba(43,217,107,0.6)]'
                : 'bg-[#f2c14b] shadow-[0_0_10px_rgba(242,193,75,0.45)]'
            }`}
          />
          {connectionStatus === 'online' ? 'Online' : 'Connecting to API'}
        </div>
      </header>

      <main className="relative z-10 grid flex-1 gap-6 overflow-hidden px-12 pb-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-0 flex-col rounded-[28px] bg-white/85 shadow-[0_20px_60px_rgba(15,18,20,0.18)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-8 pb-4 pt-7">
            <div>
              <p className="text-xl font-semibold">How can I help today?</p>
              <p className="mt-1 text-sm text-[color:var(--ink-60)]">
                
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-8 pb-2 pt-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.source === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[68%] rounded-[20px] px-4 pb-3 pt-4 text-sm leading-relaxed shadow-[0_12px_30px_rgba(15,18,20,0.12)] ${
                    message.source === 'user'
                      ? 'bg-gradient-to-br from-[#1a2a3b] to-[#2d3f52] text-[#f7f3ed]'
                      : 'bg-[#f2f4f7] text-[color:var(--ink-100)]'
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown >
                  <span
                    className={`block text-right text-[11px] ${
                      message.source === 'user'
                        ? 'text-[#f7f3ed]/70'
                        : 'text-[color:var(--ink-50)]'
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1 rounded-[20px] bg-[#f2f4f7] px-4 py-3 shadow-[0_12px_30px_rgba(15,18,20,0.12)]">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#ced4dd] [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#ced4dd] [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#ced4dd] [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          <form
            className="flex flex-wrap items-end gap-4 border-t border-black/10 px-6 pb-6 pt-4"
            onSubmit={sendMessage}
          >
            <div className="flex flex-1 flex-col gap-3 rounded-[20px] bg-[#f7f5f1] px-4 py-3 h-12">
              <textarea
                rows="1"
                className="w-full resize-none bg-transparent text-sm text-[color:var(--ink-100)] outline-none"
                placeholder="Send a message..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isSending}
              />
            </div>
            <button
              className="h-12 cursor-pointer rounded-[18px] bg-gradient-to-br from-[#101820] to-[#273449] px-6 text-sm font-semibold text-[#f5f0e6] shadow-[0_12px_30px_rgba(15,18,20,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
          {sendError ? (
            <div className="px-6 pb-6 text-sm text-[#b0382e]">
              {sendError}
            </div>
          ) : null}
        </section>

        <aside className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-[26px] bg-white/70 p-6 shadow-[0_12px_30px_rgba(15,18,20,0.12)] backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-60)]">
              Chat History
            </p>
            <button
              className="cursor-pointer rounded-full bg-gradient-to-br from-[#101820] to-[#273449] px-4 py-2 text-xs font-semibold text-[#f5f0e6]"
              type="button"
            >
              New chat
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[20px] bg-[#f8f7f4]/95 p-4">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-[color:var(--ink-60)]">
                No previous chats yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {chatHistory.map((chat) => (
                  <li key={chat.id}>
                    <button
                      className="flex w-full cursor-pointer flex-col justify-between gap-1 rounded-[16px] bg-white px-4 py-3 text-left shadow-[0_10px_24px_rgba(15,18,20,0.08)] transition hover:-translate-y-0.5"
                      type="button"
                      onClick={() => openChat(chat.id)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--ink-90)]">
                          {chat.title}
                        </p>
                      </div>
                      <span className="flex items-center text-[11px] text-[color:var(--ink-50)]">
                        {chat.date}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
