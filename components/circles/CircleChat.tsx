'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChat, useLocalParticipant } from '@livekit/components-react'
import { Send } from 'lucide-react'

export default function CircleChat() {
  const { send, chatMessages, isSending } = useChat()
  const { localParticipant } = useLocalParticipant()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isSending) {
      await send(message.trim())
      setMessage('')
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div className="border-b-[3px] border-foreground p-5 bg-background">
        <h2 className="font-heading font-extrabold text-[20px] text-foreground">Circle Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 bg-card relative">
        {chatMessages.map((msg) => {
          const isSelf = msg.from?.identity === localParticipant.identity
          
          return (
            <div key={msg.id} className={`flex flex-col gap-2 w-full relative z-10 ${isSelf ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 px-1 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`font-mono text-[12px] font-bold text-foreground px-3 py-1 border-[2px] border-foreground rounded-[100px] shadow-[2px_2px_0px_black] ${isSelf ? 'bg-[#FFD600]' : 'bg-background'}`}>
                  {isSelf ? 'You' : (msg.from?.identity || 'Anonymous')}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground font-medium mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`font-sans text-[16px] mt-1 mx-1 rounded-[16px] border-[2px] border-foreground shadow-[4px_4px_0px_black] p-4 max-w-[90%] w-fit leading-relaxed text-foreground ${isSelf ? 'bg-[#FFD600] text-right' : 'bg-card text-left'}`}>
                {msg.message}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t-[3px] border-foreground p-5 mt-auto bg-background">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            className="flex-1 h-[56px] rounded-[16px] border-[2px] border-foreground bg-card px-4 text-[16px] font-sans shadow-[4px_4px_0px_black] focus-visible:outline-none focus:shadow-[2px_2px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all placeholder:font-mono placeholder:text-muted-foreground/70 text-foreground"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="inline-flex items-center justify-center rounded-[16px] bg-[#FFD600] border-[3px] border-foreground shadow-[6px_6px_0px_black] text-foreground h-[56px] w-[56px] shrink-0 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_black] transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_black]"
          >
            <Send className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </form>
      </div>
    </div>
  )
}
