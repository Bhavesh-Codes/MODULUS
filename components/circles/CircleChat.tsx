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
    <div className="flex h-full w-full flex-col bg-white">
      <div className="border-b-[3px] border-[#0A0A0A] p-5 bg-[#F5F5F0]">
        <h2 className="font-heading font-extrabold text-[20px] text-[#0A0A0A]">Circle Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 bg-[#FFFFFF] relative">
        {chatMessages.map((msg) => {
          const isSelf = msg.from?.identity === localParticipant.identity
          
          return (
            <div key={msg.id} className={`flex flex-col gap-2 w-full relative z-10 ${isSelf ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 px-1 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`font-mono text-[12px] font-bold text-[#0A0A0A] px-3 py-1 border-[2px] border-[#0A0A0A] rounded-[100px] shadow-[2px_2px_0px_#0A0A0A] ${isSelf ? 'bg-[#FFD600]' : 'bg-[#F5F5F0]'}`}>
                  {isSelf ? 'You' : (msg.from?.identity || 'Anonymous')}
                </span>
                <span className="font-mono text-[12px] text-[#555550] font-medium mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`font-sans text-[16px] mt-1 mx-1 rounded-[16px] border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-4 max-w-[90%] w-fit leading-relaxed text-[#0A0A0A] ${isSelf ? 'bg-[#FFD600] text-right' : 'bg-[#FFFFFF] text-left'}`}>
                {msg.message}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t-[3px] border-[#0A0A0A] p-5 mt-auto bg-[#F5F5F0]">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            className="flex-1 h-[56px] rounded-[16px] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] px-4 text-[16px] font-sans shadow-[4px_4px_0px_#0A0A0A] focus-visible:outline-none focus:shadow-[2px_2px_0px_#0A0A0A] focus:translate-x-[2px] focus:translate-y-[2px] transition-all placeholder:font-mono placeholder:text-[#999990] text-[#0A0A0A]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="inline-flex items-center justify-center rounded-[16px] bg-[#FFD600] border-[3px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] text-[#0A0A0A] h-[56px] w-[56px] shrink-0 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_#0A0A0A]"
          >
            <Send className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </form>
      </div>
    </div>
  )
}
