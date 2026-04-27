'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useDataChannel } from '@livekit/components-react'

export default function CircleWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number, y: number } | null>(null)

  // Handle resizing without strictly clearing native drawings if possible
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        const canvas = canvasRef.current
        
        // Simple trick to prevent total clearing: store image data
        const ctx = canvas.getContext('2d')
        let imgData: ImageData | null = null
        if (ctx && canvas.width > 0 && canvas.height > 0) {
            imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }
        
        canvas.width = clientWidth
        canvas.height = clientHeight
        
        // Restore
        if (ctx && imgData) {
            ctx.putImageData(imgData, 0, 0)
        }
      }
    }
    window.addEventListener('resize', handleResize)
    // Run once after mount
    setTimeout(handleResize, 100)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { send } = useDataChannel('whiteboard', (msg) => {
    const decoder = new TextDecoder()
    try {
      const dataStr = decoder.decode(msg.payload)
      const data = JSON.parse(dataStr)
      if (data.type === 'clear') {
         clearBoardLocal()
      } else if (data.type === 'draw') {
         drawLineLocal(data.x0, data.y0, data.x1, data.y1, data.color)
      }
    } catch (e) {
      console.error(e)
    }
  })

  const drawLineLocal = (x0: number, y0: number, x1: number, y1: number, color: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.closePath()
  }

  const clearBoardLocal = () => {
     const canvas = canvasRef.current
     if (!canvas) return
     const ctx = canvas.getContext('2d')
     ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    const pos = getPos(e)
    lastPos.current = pos
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current) return
    const currentPos = getPos(e)
    const data = { type: 'draw', x0: lastPos.current.x, y0: lastPos.current.y, x1: currentPos.x, y1: currentPos.y, color: 'var(--foreground)' }
    
    drawLineLocal(data.x0, data.y0, data.x1, data.y1, data.color)
    
    const encoder = new TextEncoder()
    const payload = encoder.encode(JSON.stringify(data))
    send(payload, { reliable: true })
    
    lastPos.current = currentPos
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearBoardNetwork = () => {
      clearBoardLocal()
      const encoder = new TextEncoder()
      const payload = encoder.encode(JSON.stringify({ type: 'clear' }))
      send(payload, { reliable: true })
  }

  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div className="border-b-[3px] border-foreground p-5 bg-background flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-[20px] text-foreground">Whiteboard</h2>
        <button onClick={clearBoardNetwork} className="font-mono text-[12px] font-bold text-foreground bg-[#FFD600] border-[2px] border-foreground px-3 py-1 rounded-[8px] shadow-[2px_2px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_black] transition-all">Clear</button>
      </div>
      <div ref={containerRef} className="flex-1 w-full relative bg-card overflow-hidden cursor-crosshair">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--foreground) 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 touch-none z-10 block"
        />
      </div>
    </div>
  )
}
