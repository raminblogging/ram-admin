// ═══════════════════════════════════════════════════════
//  RAM.OS — Lifestyle & Productivity Pages
//  File: src/pages/LifestylePages.jsx
//  Contains: Gym, Drawing, Learning, Tracker, Productivity
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { lsGet, lsSet, newId, relativeTime, todayStr } from '../lib/api'
import { useApp } from '../lib/context'
import { Modal, PageHeader, EmptyState, FAB, FormGroup } from '../components/UI'

// ────────────────────────────────────────────────────────
//  GYM
// ────────────────────────────────────────────────────────
export function Gym() {
  const { showToast } = useApp()
  const [workouts, setWorkouts] = useState(() => lsGet('workouts', []))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', sets: '', reps: '', weight: '', notes: '' })

  function saveWorkout() {
    if (!form.name.trim()) { showToast('Exercise name required', 'error'); return }
    const updated = [{ ...form, id: newId(), date: todayStr(), createdAt: new Date().toISOString() }, ...workouts]
    setWorkouts(updated); lsSet('workouts', updated)
    setForm({ name: '', sets: '', reps: '', weight: '', notes: '' })
    showToast('Logged!', 'success'); setModalOpen(false)
  }

  const todayWorkouts = workouts.filter(w => w.date === todayStr())

  return (
    <div>
      <PageHeader title="Gym & Fitness" subtitle="Log your workouts"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>+ Log</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Logs', value: workouts.length },
          { label: 'Today', value: todayWorkouts.length },
          { label: 'This Week', value: workouts.filter(w => w.date >= new Date(Date.now() - 7*86400000).toISOString().split('T')[0]).length },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {workouts.length === 0 ? (
        <EmptyState icon="🏋️" title="No workouts logged" sub="Start tracking your fitness journey" />
      ) : workouts.map(w => (
        <div key={w.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--txt)' }}>🏋️ {w.name}</div>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 4 }}>
                {w.sets && `${w.sets} sets`} {w.reps && `× ${w.reps} reps`} {w.weight && `@ ${w.weight}kg`}
              </div>
              {w.notes && <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 4 }}>{w.notes}</div>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{w.date}</div>
          </div>
        </div>
      ))}

      <FAB onClick={() => setModalOpen(true)} label="Log workout" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Workout"
        actions={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={saveWorkout}>Log</button></>}>
        <FormGroup label="Exercise"><input className="inp" placeholder="e.g. Bench Press" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></FormGroup>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <FormGroup label="Sets"><input className="inp" type="number" placeholder="3" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} /></FormGroup>
          <FormGroup label="Reps"><input className="inp" type="number" placeholder="10" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} /></FormGroup>
          <FormGroup label="Weight kg"><input className="inp" type="number" placeholder="60" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></FormGroup>
        </div>
        <FormGroup label="Notes"><textarea className="inp" placeholder="Notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></FormGroup>
      </Modal>
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  DRAWING
// ────────────────────────────────────────────────────────
// ─── BRUSH DEFINITIONS ───────────────────────────────────
const BRUSHES = {
  pen:        { label: '🖊 Pen',         cursor: 'crosshair', group: 'Draw' },
  pencil:     { label: '✏️ Pencil',      cursor: 'crosshair', group: 'Draw' },
  brush:      { label: '🖌 Brush',       cursor: 'crosshair', group: 'Draw' },
  ink:        { label: '🪶 Ink',         cursor: 'crosshair', group: 'Draw' },
  marker:     { label: '🖍 Marker',      cursor: 'crosshair', group: 'Draw' },
  airbrush:   { label: '💨 Airbrush',    cursor: 'crosshair', group: 'Draw' },
  watercolor: { label: '🎨 Watercolor',  cursor: 'crosshair', group: 'Draw' },
  chalk:      { label: '🪨 Chalk',       cursor: 'crosshair', group: 'Draw' },
  eraser:     { label: '🧹 Eraser',      cursor: 'cell',      group: 'Edit' },
  softerase:  { label: '🌫 Soft Erase',  cursor: 'cell',      group: 'Edit' },
  fill:       { label: '🪣 Fill',        cursor: 'copy',      group: 'Edit' },
  eyedrop:    { label: '💧 Eyedrop',     cursor: 'zoom-in',   group: 'Edit' },
  smudge:     { label: '👆 Smudge',      cursor: 'crosshair', group: 'Edit' },
  line:       { label: '╱ Line',         cursor: 'crosshair', group: 'Shape' },
  rect:       { label: '▭ Rect',         cursor: 'crosshair', group: 'Shape' },
  rectfill:   { label: '▬ Rect Fill',    cursor: 'crosshair', group: 'Shape' },
  ellipse:    { label: '◯ Ellipse',      cursor: 'crosshair', group: 'Shape' },
  ellipsefill:{ label: '⬤ Circle Fill', cursor: 'crosshair', group: 'Shape' },
  triangle:   { label: '△ Triangle',     cursor: 'crosshair', group: 'Shape' },
  text:       { label: '𝐓 Text',         cursor: 'text',      group: 'Other' },
  move:       { label: '✥ Move',         cursor: 'move',      group: 'Other' },
}

const TOOL_GROUPS = [
  { label: 'Draw',  tools: ['pen','pencil','brush','ink','marker','airbrush','watercolor','chalk'] },
  { label: 'Edit',  tools: ['eraser','softerase','fill','eyedrop','smudge'] },
  { label: 'Shape', tools: ['line','rect','rectfill','ellipse','ellipsefill','triangle'] },
  { label: 'Other', tools: ['text','move'] },
]

const PALETTE = [
  '#000000','#1a1a2e','#16213e','#0f3460',
  '#ffffff','#f8f9fa','#dee2e6','#adb5bd',
  '#8b1a3a','#c0392b','#e74c3c','#ff6b6b',
  '#2563eb','#3498db','#0891b2','#48cae4',
  '#16a34a','#27ae60','#2ecc71','#34d399',
  '#d97706','#f39c12','#f97316','#fbbf24',
  '#9333ea','#8e44ad','#ec4899','#f72585',
  '#6b7280','#95a5a6','#94a3b8','#cbd5e1',
]

const CANVAS_SIZES = [
  { label: 'Square',    w: 800,  h: 800  },
  { label: 'Landscape', w: 1000, h: 600  },
  { label: 'Portrait',  w: 600,  h: 900  },
  { label: 'Wide',      w: 1200, h: 500  },
  { label: 'A4',        w: 794,  h: 1123 },
]

function applyBrushStroke(ctx, brush, x, y, prevX, prevY, color, size, opacity, hardness) {
  const px = prevX ?? x, py = prevY ?? y
  ctx.globalAlpha = opacity / 100

  if (brush === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = size * 2; ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  } else if (brush === 'softerase') {
    ctx.globalCompositeOperation = 'destination-out'
    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5)
    g.addColorStop(0, 'rgba(0,0,0,0.3)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(x, y, size * 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  } else if (brush === 'pencil') {
    ctx.globalAlpha = (opacity / 100) * 0.55
    ctx.lineWidth = size * 0.6; ctx.lineCap = 'round'; ctx.strokeStyle = color
    ctx.setLineDash([1 + Math.random(), 1 + Math.random() * 2])
    ctx.beginPath(); ctx.moveTo(px + (Math.random()-0.5), py + (Math.random()-0.5))
    ctx.lineTo(x + (Math.random()-0.5), y + (Math.random()-0.5)); ctx.stroke()
    ctx.setLineDash([])
  } else if (brush === 'marker') {
    ctx.globalAlpha = (opacity / 100) * 0.45
    ctx.lineWidth = size * 3; ctx.lineCap = 'square'; ctx.strokeStyle = color
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
  } else if (brush === 'ink') {
    const vary = 0.4 + Math.random() * 0.9
    ctx.lineWidth = Math.max(0.5, size * vary); ctx.lineCap = 'round'; ctx.strokeStyle = color
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
  } else if (brush === 'airbrush') {
    ctx.globalAlpha = (opacity / 100) * 0.04
    const count = Math.floor(size * 1.5)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * size * 2
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (brush === 'watercolor') {
    ctx.globalAlpha = (opacity / 100) * 0.08
    for (let i = 0; i < 8; i++) {
      const ox = (Math.random() - 0.5) * size * 1.2
      const oy = (Math.random() - 0.5) * size * 1.2
      const r = size * (0.5 + Math.random() * 0.8)
      const g2 = ctx.createRadialGradient(x+ox, y+oy, 0, x+ox, y+oy, r)
      g2.addColorStop(0, color)
      g2.addColorStop(1, color + '00')
      ctx.fillStyle = g2
      ctx.beginPath(); ctx.arc(x+ox, y+oy, r, 0, Math.PI*2); ctx.fill()
    }
  } else if (brush === 'chalk') {
    ctx.globalAlpha = (opacity / 100) * 0.5
    for (let i = 0; i < 6; i++) {
      ctx.lineWidth = size * (0.3 + Math.random() * 0.5)
      ctx.strokeStyle = color; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px + (Math.random()-0.5)*size*0.8, py + (Math.random()-0.5)*size*0.8)
      ctx.lineTo(x  + (Math.random()-0.5)*size*0.8, y  + (Math.random()-0.5)*size*0.8)
      ctx.stroke()
    }
  } else if (brush === 'smudge') {
    ctx.globalAlpha = 0.3
    ctx.filter = `blur(${Math.floor(size/3)}px)`
    ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.strokeStyle = color
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
    ctx.filter = 'none'
  } else {
    // pen / brush default — apply hardness via radial gradient for soft brush
    if (brush === 'brush' && hardness < 90) {
      ctx.globalAlpha = (opacity / 100) * 0.6
      const r = size * 1.2
      const g3 = ctx.createRadialGradient(x, y, 0, x, y, r)
      g3.addColorStop(hardness / 100, color)
      g3.addColorStop(1, color + '00')
      ctx.fillStyle = g3
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    } else {
      ctx.lineWidth = brush === 'brush' ? size * 1.4 : size
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

export function Drawing() {
  const { showToast } = useApp()
  const canvasRef  = useRef(null)
  const overlayRef = useRef(null)
  const gridRef    = useRef(null)

  // Tool state
  const [isDrawing, setIsDrawing]   = useState(false)
  const [tool, setTool]             = useState('brush')
  const [color, setColor]           = useState('#000000')
  const [secondColor, setSecondColor] = useState('#ffffff')
  const [size, setSize]             = useState(8)
  const [opacity, setOpacity]       = useState(100)
  const [hardness, setHardness]     = useState(80)
  const [bgColor, setBgColor]       = useState('#ffffff')
  const [fontSize, setFontSize]     = useState(24)
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontBold, setFontBold]     = useState(false)
  const [fontItalic, setFontItalic] = useState(false)
  const [fillShapes, setFillShapes] = useState(false)

  // Canvas config
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZES[1])
  const [showGrid, setShowGrid]     = useState(false)
  const [gridSize, setGridSize]     = useState(40)
  const [symmetry, setSymmetry]     = useState('none') // none | horizontal | vertical | quad
  const [zoom, setZoom]             = useState(100)
  const [smoothing, setSmoothing]   = useState(true)

  // UI panels
  const [showSettings, setShowSettings] = useState(false)
  const [showSaved, setShowSaved]       = useState(false)
  const [activePanel, setActivePanel]   = useState(null) // 'brushes' | 'canvas' | null
  const [customColors, setCustomColors] = useState(() => lsGet('draw_custom_colors', []))
  const [savedSketches, setSavedSketches] = useState(() => lsGet('saved_sketches', []))

  // Text tool
  const [textInput, setTextInput]   = useState('')
  const [textPos, setTextPos]       = useState(null)

  // History
  const [history, setHistory]       = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const prevPos    = useRef(null)
  const shapeStart = useRef(null)
  const pointBuffer = useRef([])

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    doSaveHistory()
  }, [])

  // Draw grid overlay
  useEffect(() => {
    const gc = gridRef.current; if (!gc) return
    const gx = gc.getContext('2d')
    gx.clearRect(0, 0, gc.width, gc.height)
    if (!showGrid) return
    gx.strokeStyle = 'rgba(100,100,200,0.2)'; gx.lineWidth = 1
    for (let x = 0; x < gc.width; x += gridSize) {
      gx.beginPath(); gx.moveTo(x, 0); gx.lineTo(x, gc.height); gx.stroke()
    }
    for (let y = 0; y < gc.height; y += gridSize) {
      gx.beginPath(); gx.moveTo(0, y); gx.lineTo(gc.width, y); gx.stroke()
    }
  }, [showGrid, gridSize, canvasSize])

  function getCanvas()     { return canvasRef.current }
  function getCtx()        { return getCanvas()?.getContext('2d') }
  function getOverlay()    { return overlayRef.current }
  function getOverlayCtx() { return getOverlay()?.getContext('2d') }

  function doSaveHistory() {
    const canvas = getCanvas(); if (!canvas) return
    const snap = canvas.toDataURL()
    setHistory(h => {
      const newH = [...h.slice(0, historyIndex + 1), snap].slice(-40)
      return newH
    })
    setHistoryIndex(i => Math.min(i + 1, 39))
  }

  function undo() {
    if (historyIndex <= 0) return
    const idx = historyIndex - 1; setHistoryIndex(idx)
    const img = new Image(); img.src = history[idx]
    img.onload = () => {
      const ctx = getCtx()
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h); ctx.drawImage(img, 0, 0)
    }
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    const idx = historyIndex + 1; setHistoryIndex(idx)
    const img = new Image(); img.src = history[idx]
    img.onload = () => {
      const ctx = getCtx()
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h); ctx.drawImage(img, 0, 0)
    }
  }

  function getPos(e) {
    const canvas = getCanvas()
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const touch = e.touches?.[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function mirrorPositions(x, y) {
    const pts = [{ x, y }]
    if (symmetry === 'horizontal' || symmetry === 'quad') pts.push({ x: canvasSize.w - x, y })
    if (symmetry === 'vertical'   || symmetry === 'quad') pts.push({ x, y: canvasSize.h - y })
    if (symmetry === 'quad') pts.push({ x: canvasSize.w - x, y: canvasSize.h - y })
    return pts
  }

  function strokeAll(ctx, x, y, prevX, prevY) {
    const pts = mirrorPositions(x, y)
    const prevPts = mirrorPositions(prevX ?? x, prevY ?? y)
    pts.forEach((pt, i) => {
      applyBrushStroke(ctx, tool, pt.x, pt.y, prevPts[i].x, prevPts[i].y, color, size, opacity, hardness)
    })
  }

  function floodFill(ctx, startX, startY, fillColor) {
    const canvas = getCanvas()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const w = canvas.width, h = canvas.height
    const idx = (y, x) => (y * w + x) * 4
    const sx = Math.max(0, Math.min(w-1, Math.floor(startX)))
    const sy = Math.max(0, Math.min(h-1, Math.floor(startY)))
    const sr = data[idx(sy,sx)], sg = data[idx(sy,sx)+1], sb = data[idx(sy,sx)+2], sa = data[idx(sy,sx)+3]
    const [fr, fg, fb, fa] = fillColor
    if (sr===fr && sg===fg && sb===fb && sa===fa) return
    const stack = [[sx, sy]]
    while (stack.length) {
      const [cx, cy] = stack.pop()
      if (cx<0||cx>=w||cy<0||cy>=h) continue
      const i = idx(cy, cx)
      if (data[i]!==sr||data[i+1]!==sg||data[i+2]!==sb||data[i+3]!==sa) continue
      data[i]=fr; data[i+1]=fg; data[i+2]=fb; data[i+3]=fa
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1])
    }
    ctx.putImageData(imageData, 0, 0)
  }

  function hexToRgba(hex) {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16)
    return [r,g,b,255]
  }

  function eyedrop(x, y) {
    const ctx = getCtx(); if (!ctx) return
    const px = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    setColor('#' + [px[0],px[1],px[2]].map(v => v.toString(16).padStart(2,'0')).join(''))
  }

  function drawShape(ctx, tool, sx, sy, ex, ey) {
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'
    ctx.fillStyle = color; ctx.globalAlpha = opacity / 100
    ctx.beginPath()
    if (tool === 'line') {
      ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
    } else if (tool === 'rect') {
      ctx.rect(sx, sy, ex-sx, ey-sy); ctx.stroke()
    } else if (tool === 'rectfill') {
      ctx.fillRect(sx, sy, ex-sx, ey-sy)
    } else if (tool === 'ellipse') {
      ctx.ellipse((sx+ex)/2,(sy+ey)/2,Math.abs(ex-sx)/2,Math.abs(ey-sy)/2,0,0,Math.PI*2); ctx.stroke()
    } else if (tool === 'ellipsefill') {
      ctx.ellipse((sx+ex)/2,(sy+ey)/2,Math.abs(ex-sx)/2,Math.abs(ey-sy)/2,0,0,Math.PI*2); ctx.fill()
    } else if (tool === 'triangle') {
      ctx.moveTo((sx+ex)/2, sy); ctx.lineTo(ex, ey); ctx.lineTo(sx, ey); ctx.closePath()
      fillShapes ? ctx.fill() : ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const SHAPE_TOOLS = ['line','rect','rectfill','ellipse','ellipsefill','triangle']
  const DRAW_TOOLS  = ['pen','pencil','brush','ink','marker','airbrush','watercolor','chalk','eraser','softerase','smudge']

  function startDraw(e) {
    e.preventDefault()
    const { x, y } = getPos(e)
    if (tool === 'eyedrop') { eyedrop(x, y); return }
    if (tool === 'fill') {
      const ctx = getCtx(); if (!ctx) return
      floodFill(ctx, x, y, hexToRgba(color)); doSaveHistory(); return
    }
    if (tool === 'text') { setTextPos({ x, y }); return }
    setIsDrawing(true)
    prevPos.current = { x, y }
    shapeStart.current = { x, y }
    pointBuffer.current = [{ x, y }]
  }

  function onDraw(e) {
    e.preventDefault()
    if (!isDrawing) return
    const { x, y } = getPos(e)
    const ctx = getCtx(); if (!ctx) return
    const prev = prevPos.current

    if (DRAW_TOOLS.includes(tool)) {
      if (smoothing && pointBuffer.current.length > 2) {
        const pts = pointBuffer.current
        const i = pts.length - 1
        const mx = (pts[i].x + x) / 2, my = (pts[i].y + y) / 2
        strokeAll(ctx, mx, my, pts[i].x, pts[i].y)
      } else {
        strokeAll(ctx, x, y, prev.x, prev.y)
      }
      pointBuffer.current.push({ x, y })
      prevPos.current = { x, y }
    } else if (SHAPE_TOOLS.includes(tool)) {
      const oc = getOverlayCtx(); const overlay = getOverlay(); if (!oc) return
      oc.clearRect(0, 0, overlay.width, overlay.height)
      drawShape(oc, tool, shapeStart.current.x, shapeStart.current.y, x, y)
    }
  }

  function stopDraw(e) {
    if (!isDrawing) return
    setIsDrawing(false)
    if (SHAPE_TOOLS.includes(tool)) {
      const { x, y } = getPos(e)
      const ctx = getCtx(); if (!ctx) return
      const oc = getOverlayCtx(); const overlay = getOverlay()
      oc.clearRect(0, 0, overlay.width, overlay.height)
      drawShape(ctx, tool, shapeStart.current.x, shapeStart.current.y, x, y)
    }
    doSaveHistory()
    prevPos.current = null
    pointBuffer.current = []
  }

  function placeText() {
    if (!textInput.trim() || !textPos) return
    const ctx = getCtx(); if (!ctx) return
    const style = `${fontItalic ? 'italic ' : ''}${fontBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`
    ctx.font = style; ctx.fillStyle = color; ctx.globalAlpha = opacity / 100
    ctx.fillText(textInput, textPos.x, textPos.y)
    ctx.globalAlpha = 1
    setTextInput(''); setTextPos(null); doSaveHistory()
  }

  function clearCanvas() {
    const ctx = getCtx(); const canvas = getCanvas(); if (!ctx||!canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height)
    doSaveHistory()
  }

  function saveCanvas() {
    const canvas = getCanvas(); if (!canvas) return
    const a = document.createElement('a')
    a.download = `ram-sketch-${Date.now()}.png`; a.href = canvas.toDataURL('image/png'); a.click()
  }

  function exportJpg() {
    const canvas = getCanvas(); if (!canvas) return
    const a = document.createElement('a')
    a.download = `ram-sketch-${Date.now()}.jpg`; a.href = canvas.toDataURL('image/jpeg', 0.9); a.click()
  }

  function saveSketch() {
    const canvas = getCanvas(); if (!canvas) return
    const thumb = canvas.toDataURL('image/jpeg', 0.5)
    const sketch = { id: newId(), thumb, date: todayStr(), savedAt: new Date().toLocaleTimeString() }
    const updated = [sketch, ...savedSketches].slice(0, 12)
    setSavedSketches(updated); lsSet('saved_sketches', updated)
    showToast('Sketch saved!', 'success')
  }

  function loadSketch(thumb) {
    const img = new Image(); img.src = thumb
    img.onload = () => {
      const ctx = getCtx(); if (!ctx) return
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h); ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h)
      doSaveHistory()
    }
    setShowSaved(false)
  }

  function deleteSketch(id) {
    const updated = savedSketches.filter(s => s.id !== id)
    setSavedSketches(updated); lsSet('saved_sketches', updated)
  }

  function swapColors() { const tmp = color; setColor(secondColor); setSecondColor(tmp) }

  function changeCanvasSize(cs) {
    setCanvasSize(cs)
    // Preserve current drawing on resize
    setTimeout(() => {
      const canvas = canvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, cs.w, cs.h)
      doSaveHistory()
    }, 50)
    setActivePanel(null)
  }

  const panelBtn = (id, label) => (
    <button onClick={() => setActivePanel(activePanel === id ? null : id)}
      style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${activePanel === id ? 'var(--acc)' : 'var(--bdr)'}`, background: activePanel === id ? 'var(--acc)22' : 'var(--bg3)', cursor: 'pointer', fontSize: 11, color: activePanel === id ? 'var(--acc3)' : 'var(--txt2)', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )

  return (
    <div>
      {/* ── Header ── */}
      <PageHeader title="Drawing Studio" subtitle="Professional canvas"
        actions={
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={undo} title="Undo (Ctrl+Z)">↩</button>
            <button className="btn btn-ghost btn-sm" onClick={redo} title="Redo">↪</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSaved(s => !s)}>🖼 Saved</button>
            <button className="btn btn-ghost btn-sm" onClick={saveSketch}>💾</button>
            <button className="btn btn-ghost btn-sm" onClick={clearCanvas}>🗑</button>
            <button className="btn btn-ghost btn-sm" onClick={exportJpg}>JPG</button>
            <button className="btn btn-primary btn-sm" onClick={saveCanvas}>↓ PNG</button>
          </div>
        }
      />

      {/* ── Saved Sketches Panel ── */}
      {showSaved && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>🖼 Saved Sketches ({savedSketches.length}/12)</div>
          {savedSketches.length === 0 && <div style={{ fontSize: 12, color: 'var(--txt3)' }}>No saved sketches yet. Hit 💾 to save.</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {savedSketches.map(s => (
              <div key={s.id} style={{ position: 'relative' }}>
                <img src={s.thumb} onClick={() => loadSketch(s.thumb)}
                  style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid var(--bdr)' }} />
                <div style={{ fontSize: 9, color: 'var(--txt3)', textAlign: 'center' }}>{s.savedAt}</div>
                <button onClick={() => deleteSketch(s.id)}
                  style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--acc3)', border: 'none', cursor: 'pointer', fontSize: 10, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top option bar ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        {panelBtn('canvas', `📐 ${canvasSize.label}`)}
        {panelBtn('symmetry', `🔀 ${symmetry === 'none' ? 'Symmetry' : symmetry}`)}
        {panelBtn('grid', showGrid ? `◫ Grid ${gridSize}px` : '◫ Grid')}
        <button onClick={() => setSmoothing(s => !s)}
          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${smoothing ? 'var(--acc)' : 'var(--bdr)'}`, background: smoothing ? 'var(--acc)22' : 'var(--bg3)', cursor: 'pointer', fontSize: 11, color: smoothing ? 'var(--acc3)' : 'var(--txt2)' }}>
          〰 Smooth
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--txt2)' }}>Zoom</span>
          <select value={zoom} onChange={e => setZoom(+e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, color: 'var(--txt)', fontSize: 11, padding: '3px 4px' }}>
            {[50,75,100,125,150,200].map(z => <option key={z} value={z}>{z}%</option>)}
          </select>
        </div>
      </div>

      {/* ── Canvas size panel ── */}
      {activePanel === 'canvas' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Canvas Size</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CANVAS_SIZES.map(cs => (
              <button key={cs.label} onClick={() => changeCanvasSize(cs)}
                style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${canvasSize.label===cs.label ? 'var(--acc)':'var(--bdr)'}`, background: canvasSize.label===cs.label ? 'var(--acc)22':'var(--bg3)', cursor: 'pointer', fontSize: 12, color: 'var(--txt)' }}>
                {cs.label}<br /><span style={{ fontSize: 10, color: 'var(--txt3)' }}>{cs.w}×{cs.h}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--txt2)' }}>BG Color</span>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 32, height: 24, border: 'none', cursor: 'pointer', padding: 0, borderRadius: 4 }} />
          </div>
        </div>
      )}

      {/* ── Symmetry panel ── */}
      {activePanel === 'symmetry' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Symmetry Mode</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['none','Off'],['horizontal','↔ H'],['vertical','↕ V'],['quad','⊞ Quad']].map(([v,l]) => (
              <button key={v} onClick={() => { setSymmetry(v); setActivePanel(null) }}
                style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${symmetry===v?'var(--acc)':'var(--bdr)'}`, background: symmetry===v?'var(--acc)22':'var(--bg3)', cursor: 'pointer', fontSize: 12, color: 'var(--txt)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid panel ── */}
      {activePanel === 'grid' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--txt)' }}>
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              Show Grid
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--txt2)' }}>Size {gridSize}px</span>
              <input type="range" min="10" max="100" step="10" value={gridSize} onChange={e => setGridSize(+e.target.value)} style={{ width: 80 }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main drawing area ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>

        {/* Left toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 44, maxHeight: '70vh', overflowY: 'auto' }}>
          {TOOL_GROUPS.map(g => (
            <div key={g.label}>
              <div style={{ fontSize: 8, color: 'var(--txt3)', textAlign: 'center', marginBottom: 2, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{g.label}</div>
              {g.tools.map(t => (
                <button key={t} title={BRUSHES[t]?.label} onClick={() => setTool(t)}
                  style={{ width: 40, height: 36, borderRadius: 8, border: `2px solid ${tool===t?'var(--acc)':'var(--bdr)'}`, background: tool===t?'var(--acc)':'var(--bg3)', cursor: 'pointer', fontSize: 15, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
                  <span style={{ filter: tool===t?'brightness(10)':'none' }}>{BRUSHES[t]?.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          ))}

          {/* Color swatches */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--bdr)' }}>
            <div style={{ position: 'relative', width: 40, height: 40, marginBottom: 4 }}>
              <div onClick={() => setSecondColor(color)} style={{ width: 26, height: 26, background: secondColor, borderRadius: 5, border: '2px solid var(--bdr)', position: 'absolute', bottom: 0, right: 0, cursor: 'pointer' }} />
              <div onClick={swapColors} style={{ width: 26, height: 26, background: color, borderRadius: 5, border: '2px solid var(--txt)', position: 'absolute', top: 0, left: 0, cursor: 'pointer', zIndex: 1 }} title="Click to swap" />
            </div>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 40, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0, background: 'none', marginBottom: 2 }} />
            <input type="color" value={secondColor} onChange={e => setSecondColor(e.target.value)}
              style={{ width: 40, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0, background: 'none', opacity: 0.6 }} />
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
          <div style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top left', display: 'inline-block' }}>
            <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
              style={{ background: bgColor, borderRadius: 8, cursor: BRUSHES[tool]?.cursor||'crosshair', touchAction: 'none', display: 'block', border: '1px solid var(--bdr)', maxWidth: '100%' }}
              onMouseDown={startDraw} onMouseMove={onDraw} onMouseUp={stopDraw} onMouseLeave={e => { if(isDrawing) stopDraw(e) }}
              onTouchStart={startDraw} onTouchMove={onDraw} onTouchEnd={stopDraw}
            />
            <canvas ref={overlayRef} width={canvasSize.w} height={canvasSize.h}
              style={{ position: 'absolute', top: 0, left: 0, borderRadius: 8, pointerEvents: 'none', maxWidth: '100%' }} />
            <canvas ref={gridRef} width={canvasSize.w} height={canvasSize.h}
              style={{ position: 'absolute', top: 0, left: 0, borderRadius: 8, pointerEvents: 'none', maxWidth: '100%' }} />
            {symmetry !== 'none' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 8 }}>
                {(symmetry==='horizontal'||symmetry==='quad') && <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: 'rgba(100,100,255,0.4)', borderLeft: '1px dashed rgba(100,100,255,0.5)' }} />}
                {(symmetry==='vertical'||symmetry==='quad') && <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: 'rgba(100,100,255,0.4)', borderTop: '1px dashed rgba(100,100,255,0.5)' }} />}
              </div>
            )}
            {/* Text placement */}
            {textPos && (
              <div style={{ position: 'absolute', top: (textPos.y/canvasSize.h*100)+'%', left: (textPos.x/canvasSize.w*100)+'%', zIndex: 10, display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg2)', padding: 6, borderRadius: 8, border: '1px solid var(--bdr)' }}>
                <input className="inp" autoFocus value={textInput} onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter') placeText(); if(e.key==='Escape'){setTextPos(null);setTextInput('')} }}
                  style={{ fontSize: Math.min(fontSize, 18), width: 160, fontFamily, fontWeight: fontBold?'bold':'normal', fontStyle: fontItalic?'italic':'normal', color, background: 'transparent', padding: '3px 6px' }}
                  placeholder="Type here…" />
                <button className="btn btn-primary btn-sm" onClick={placeText}>✓</button>
                <button className="btn btn-ghost btn-sm" onClick={() => {setTextPos(null);setTextInput('')}}>✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 110 }}>
            <span style={{ fontSize: 11, color: 'var(--txt2)', whiteSpace: 'nowrap' }}>Size {size}</span>
            <input type="range" min="1" max="80" value={size} onChange={e => setSize(+e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 110 }}>
            <span style={{ fontSize: 11, color: 'var(--txt2)', whiteSpace: 'nowrap' }}>Opacity {opacity}%</span>
            <input type="range" min="1" max="100" value={opacity} onChange={e => setOpacity(+e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 110 }}>
            <span style={{ fontSize: 11, color: 'var(--txt2)', whiteSpace: 'nowrap' }}>Hardness {hardness}%</span>
            <input type="range" min="10" max="100" value={hardness} onChange={e => setHardness(+e.target.value)} style={{ flex: 1 }} />
          </div>
          {tool === 'text' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--txt2)' }}>Font {fontSize}px</span>
                <input type="range" min="10" max="120" value={fontSize} onChange={e => setFontSize(+e.target.value)} style={{ width: 70 }} />
              </div>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, color: 'var(--txt)', fontSize: 11, padding: '4px 6px' }}>
                {['sans-serif','serif','monospace','cursive','fantasy'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={() => setFontBold(b=>!b)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${fontBold?'var(--acc)':'var(--bdr)'}`, background: fontBold?'var(--acc)':'var(--bg3)', cursor: 'pointer', fontWeight: 'bold', color: 'var(--txt)', fontSize: 13 }}>B</button>
              <button onClick={() => setFontItalic(i=>!i)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${fontItalic?'var(--acc)':'var(--bdr)'}`, background: fontItalic?'var(--acc)':'var(--bg3)', cursor: 'pointer', fontStyle: 'italic', color: 'var(--txt)', fontSize: 13 }}>I</button>
            </>
          )}
        </div>
      </div>

      {/* ── Colour palette ── */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Palette</span>
          <span style={{ color: 'var(--txt3)' }}>Click = primary · Right-click = secondary</span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {[...PALETTE, ...customColors].map(c => (
            <div key={c} onClick={() => setColor(c)} onContextMenu={e => { e.preventDefault(); setSecondColor(c) }}
              style={{ width: 24, height: 24, borderRadius: 5, background: c, cursor: 'pointer', border: color===c ? '3px solid var(--txt)' : secondColor===c ? '3px solid var(--acc3)' : '2px solid var(--bdr)', flexShrink: 0, transition: 'transform 0.1s' }} />
          ))}
          <input type="color" title="Add to palette" value={color}
            onChange={e => { setColor(e.target.value); if(!PALETTE.includes(e.target.value)&&!customColors.includes(e.target.value)){ setCustomColors(cc=>[...cc.slice(-11),e.target.value]); lsSet('draw_custom_colors',[...customColors.slice(-11),e.target.value]) } }}
            style={{ width: 24, height: 24, borderRadius: 5, border: '2px dashed var(--bdr)', cursor: 'pointer', padding: 0, background: 'none' }} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{ fontSize: 11, color: 'var(--txt3)', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 8 }}>
        <span><strong style={{ color: 'var(--txt)' }}>{BRUSHES[tool]?.label}</strong></span>
        <span>{size}px · {opacity}% opacity · {hardness}% hardness</span>
        <span>{canvasSize.w}×{canvasSize.h}px</span>
        {symmetry !== 'none' && <span style={{ color: 'var(--acc3)' }}>🔀 {symmetry} symmetry</span>}
        {showGrid && <span style={{ color: 'var(--acc3)' }}>◫ grid on</span>}
        <span>History: {historyIndex+1}/{history.length}</span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  LEARNING
// ────────────────────────────────────────────────────────
export function Learning() {
  const { showToast } = useApp()
  const [items, setItems] = useState(() => lsGet('learning', []))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', resource: '', category: '', status: 'in-progress', notes: '' })

  function save() {
    if (!form.title.trim()) { showToast('Title required', 'error'); return }
    const updated = [{ ...form, id: newId(), createdAt: new Date().toISOString() }, ...items]
    setItems(updated); lsSet('learning', updated)
    showToast('Added!', 'success'); setModalOpen(false)
    setForm({ title: '', resource: '', category: '', status: 'in-progress', notes: '' })
  }

  const STATUS_COLORS = { 'in-progress': '#d97706', 'completed': '#16a34a', 'planned': '#2563eb' }

  return (
    <div>
      <PageHeader title="Learning" subtitle="Track what you're studying"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>+ Add</button>} />

      {items.length === 0 ? (
        <EmptyState icon="🧠" title="Start your learning log" sub="Track courses, books, tutorials" />
      ) : items.map(item => (
        <div key={item.id} className="card" style={{ borderLeft: `3px solid ${STATUS_COLORS[item.status] || 'var(--acc)'}` }}>
          <div style={{ fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {item.category && <span>📂 {item.category}</span>}
            {item.resource && <span>🔗 {item.resource}</span>}
            <span style={{ color: STATUS_COLORS[item.status] }}>{item.status}</span>
          </div>
          {item.notes && <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 6 }}>{item.notes}</div>}
        </div>
      ))}

      <FAB onClick={() => setModalOpen(true)} label="Add learning item" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Learning Item"
        actions={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add</button></>}>
        <FormGroup label="Title"><input className="inp" placeholder="Book / course / tutorial" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></FormGroup>
        <FormGroup label="Resource / URL"><input className="inp" placeholder="Link or source" value={form.resource} onChange={e => setForm(f => ({ ...f, resource: e.target.value }))} /></FormGroup>
        <FormGroup label="Category"><input className="inp" placeholder="e.g. Programming, Design" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></FormGroup>
        <FormGroup label="Status">
          <select className="inp" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="planned">📋 Planned</option>
            <option value="in-progress">⚡ In Progress</option>
            <option value="completed">✅ Completed</option>
          </select>
        </FormGroup>
        <FormGroup label="Notes"><textarea className="inp" placeholder="Notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></FormGroup>
      </Modal>
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  TRACKER
// ────────────────────────────────────────────────────────
export function Tracker() {
  const { showToast } = useApp()
  const [activities, setActivities] = useState(() => lsGet('tracker_activities', []))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'sport', duration: '', notes: '' })

  function save() {
    if (!form.name.trim()) { showToast('Name required', 'error'); return }
    const updated = [{ ...form, id: newId(), date: todayStr(), createdAt: new Date().toISOString() }, ...activities]
    setActivities(updated); lsSet('tracker_activities', updated)
    setForm({ name: '', category: 'sport', duration: '', notes: '' })
    showToast('Logged!', 'success'); setModalOpen(false)
  }

  const CATS = { sport: '⚽', fitness: '💪', skill: '🎯', hobby: '🎨', other: '📌' }

  return (
    <div>
      <PageHeader title="Tracker" subtitle="Track activities & progress"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>+ Log</button>} />

      {activities.length === 0 ? (
        <EmptyState icon="⚽" title="No activities logged" sub="Track sports, hobbies, skills" />
      ) : activities.map(a => (
        <div key={a.id} className="card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>{CATS[a.category] || '📌'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--txt)' }}>{a.name}</div>
              <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{a.date}{a.duration && ` · ${a.duration} min`}</div>
              {a.notes && <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 3 }}>{a.notes}</div>}
            </div>
          </div>
        </div>
      ))}

      <FAB onClick={() => setModalOpen(true)} label="Log activity" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Activity"
        actions={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Log</button></>}>
        <FormGroup label="Activity"><input className="inp" placeholder="e.g. Football, Guitar, Coding" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></FormGroup>
        <FormGroup label="Category">
          <select className="inp" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {Object.entries(CATS).map(([v, ic]) => <option key={v} value={v}>{ic} {v}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Duration (min)"><input className="inp" type="number" placeholder="60" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></FormGroup>
        <FormGroup label="Notes"><textarea className="inp" placeholder="Notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></FormGroup>
      </Modal>
    </div>
  )
}


// ────────────────────────────────────────────────────────
//  PRODUCTIVITY — Full Work Suite
// ────────────────────────────────────────────────────────
export function Productivity() {
  const { showToast } = useApp()
  const [tab, setTab] = useState('dashboard')

  // ── Pomodoro ──────────────────────────────────────────
  const [pomMode, setPomMode]       = useState('work')
  const [pomSeconds, setPomSeconds] = useState(25 * 60)
  const [pomRunning, setPomRunning] = useState(false)
  const [pomSessions, setPomSessions] = useState(() => lsGet('pom_sessions', 0))
  const [customWork, setCustomWork]   = useState(() => lsGet('pom_work_min', 25))
  const [customBreak, setCustomBreak] = useState(() => lsGet('pom_break_min', 5))
  const [customLong, setCustomLong]   = useState(() => lsGet('pom_long_min', 15))
  const [showPomSettings, setShowPomSettings] = useState(false)
  const [pomTask, setPomTask] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (pomRunning) {
      timerRef.current = setInterval(() => {
        setPomSeconds(s => {
          if (s <= 1) {
            setPomRunning(false); clearInterval(timerRef.current)
            if (pomMode === 'work') {
              const ns = pomSessions + 1; setPomSessions(ns); lsSet('pom_sessions', ns)
              showToast('🎉 Focus session done! Take a break.', 'success')
              return customBreak * 60
            }
            showToast('☕ Break over! Back to work.', 'success')
            return customWork * 60
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [pomRunning, pomMode, pomSessions, customWork, customBreak])

  const pomTotal = pomMode === 'work' ? customWork * 60 : pomMode === 'break' ? customBreak * 60 : customLong * 60
  const pomPct   = Math.min(100, ((pomTotal - pomSeconds) / pomTotal) * 100)
  const pomMins  = String(Math.floor(pomSeconds / 60)).padStart(2, '0')
  const pomSecs  = String(pomSeconds % 60).padStart(2, '0')

  function switchPomMode(mode) {
    setPomRunning(false); clearInterval(timerRef.current); setPomMode(mode)
    if (mode === 'work')  setPomSeconds(customWork * 60)
    else if (mode === 'break') setPomSeconds(customBreak * 60)
    else setPomSeconds(customLong * 60)
  }

  function savePomSettings() {
    lsSet('pom_work_min', customWork); lsSet('pom_break_min', customBreak); lsSet('pom_long_min', customLong)
    switchPomMode('work'); setShowPomSettings(false); showToast('Timer settings saved', 'success')
  }

  // ── Kanban Board ────────────────────────────────────
  const DEFAULT_KANBAN = { todo: [], doing: [], review: [], done: [] }
  const [kanban, setKanban] = useState(() => lsGet('kanban', DEFAULT_KANBAN))
  const [kanbanForm, setKanbanForm] = useState({ text: '', tag: '', priority: 'medium' })
  const [addingCol, setAddingCol] = useState(null)
  const [dragCard, setDragCard] = useState(null)
  const [dragFrom, setDragFrom] = useState(null)

  function addCard(col) {
    if (!kanbanForm.text.trim()) return
    const card = { id: newId(), text: kanbanForm.text.trim(), tag: kanbanForm.tag, priority: kanbanForm.priority, createdAt: todayStr() }
    const updated = { ...kanban, [col]: [card, ...kanban[col]] }
    setKanban(updated); lsSet('kanban', updated)
    setKanbanForm({ text: '', tag: '', priority: 'medium' }); setAddingCol(null)
  }

  function deleteCard(col, id) {
    const updated = { ...kanban, [col]: kanban[col].filter(c => c.id !== id) }
    setKanban(updated); lsSet('kanban', updated)
  }

  function moveCard(fromCol, toCol, cardId) {
    const card = kanban[fromCol].find(c => c.id === cardId)
    if (!card) return
    const updated = { ...kanban, [fromCol]: kanban[fromCol].filter(c => c.id !== cardId), [toCol]: [card, ...kanban[toCol]] }
    setKanban(updated); lsSet('kanban', updated)
  }

  const KANBAN_COLS = [
    { id: 'todo',   label: '📋 To Do',       color: '#6b7280' },
    { id: 'doing',  label: '⚡ In Progress',  color: '#d97706' },
    { id: 'review', label: '👀 Review',       color: '#2563eb' },
    { id: 'done',   label: '✅ Done',         color: '#16a34a' },
  ]
  const PRIORITY_COLOR = { low: '#6b7280', medium: '#d97706', high: '#dc2626' }

  // ── Weekly Planner ──────────────────────────────────
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const [weekPlan, setWeekPlan] = useState(() => lsGet('week_plan', {}))
  const [editingDay, setEditingDay] = useState(null)
  const [dayInput, setDayInput] = useState('')

  function addDayItem(day) {
    if (!dayInput.trim()) return
    const updated = { ...weekPlan, [day]: [...(weekPlan[day] || []), { id: newId(), text: dayInput.trim(), done: false }] }
    setWeekPlan(updated); lsSet('week_plan', updated); setDayInput('')
  }

  function toggleDayItem(day, id) {
    const updated = { ...weekPlan, [day]: (weekPlan[day] || []).map(i => i.id === id ? { ...i, done: !i.done } : i) }
    setWeekPlan(updated); lsSet('week_plan', updated)
  }

  function deleteDayItem(day, id) {
    const updated = { ...weekPlan, [day]: (weekPlan[day] || []).filter(i => i.id !== id) }
    setWeekPlan(updated); lsSet('week_plan', updated)
  }

  // ── Projects ────────────────────────────────────────
  const [projects, setProjects]     = useState(() => lsGet('projects', []))
  const [projModal, setProjModal]   = useState(false)
  const [projForm, setProjForm]     = useState({ name: '', client: '', status: 'active', deadline: '', progress: 0, notes: '' })
  const [expandedProj, setExpandedProj] = useState(null)
  const PROJ_STATUS = {
    active:    { label: 'Active',     color: '#16a34a' },
    paused:    { label: 'Paused',     color: '#d97706' },
    completed: { label: 'Completed',  color: '#2563eb' },
    cancelled: { label: 'Cancelled',  color: '#dc2626' },
  }

  function saveProject() {
    if (!projForm.name.trim()) { showToast('Project name required', 'error'); return }
    const entry = { ...projForm, id: newId(), createdAt: todayStr(), progress: Number(projForm.progress) }
    const updated = [entry, ...projects]; setProjects(updated); lsSet('projects', updated)
    setProjModal(false); setProjForm({ name: '', client: '', status: 'active', deadline: '', progress: 0, notes: '' })
    showToast('Project saved!', 'success')
  }

  function updateProjStatus(id, status) {
    const updated = projects.map(p => p.id === id ? { ...p, status } : p)
    setProjects(updated); lsSet('projects', updated)
  }

  function updateProjProgress(id, val) {
    const updated = projects.map(p => p.id === id ? { ...p, progress: Number(val) } : p)
    setProjects(updated); lsSet('projects', updated)
  }

  function deleteProject(id) {
    const updated = projects.filter(p => p.id !== id); setProjects(updated); lsSet('projects', updated)
  }

  // ── Invoices / Billing ──────────────────────────────
  const [invoices, setInvoices]   = useState(() => lsGet('invoices', []))
  const [invModal, setInvModal]   = useState(false)
  const [invForm, setInvForm]     = useState({ client: '', amount: '', currency: 'USD', status: 'unpaid', due: '', description: '' })
  const INV_STATUS = {
    unpaid:  { label: 'Unpaid',   color: '#dc2626' },
    paid:    { label: 'Paid',     color: '#16a34a' },
    overdue: { label: 'Overdue',  color: '#9333ea' },
    pending: { label: 'Pending',  color: '#d97706' },
  }

  function saveInvoice() {
    if (!invForm.client.trim() || !invForm.amount) { showToast('Client and amount required', 'error'); return }
    const inv = { ...invForm, id: newId(), invoiceNo: 'INV-' + Date.now().toString(36).toUpperCase().slice(-6), date: todayStr() }
    const updated = [inv, ...invoices]; setInvoices(updated); lsSet('invoices', updated)
    setInvModal(false); setInvForm({ client: '', amount: '', currency: 'USD', status: 'unpaid', due: '', description: '' })
    showToast('Invoice saved!', 'success')
  }

  function markInvPaid(id) {
    const updated = invoices.map(i => i.id === id ? { ...i, status: 'paid' } : i)
    setInvoices(updated); lsSet('invoices', updated)
  }

  function deleteInvoice(id) {
    const updated = invoices.filter(i => i.id !== id); setInvoices(updated); lsSet('invoices', updated)
  }

  const totalEarned  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0)

  // ── Focus Goals ─────────────────────────────────────
  const [goals, setGoals]   = useState(() => lsGet('focus_goals_' + todayStr(), []))
  const [newGoal, setNewGoal] = useState('')

  function addGoal() {
    if (!newGoal.trim()) return
    const updated = [...goals, { id: newId(), text: newGoal.trim(), done: false }]
    setGoals(updated); lsSet('focus_goals_' + todayStr(), updated); setNewGoal('')
  }
  function toggleGoal(id) {
    const updated = goals.map(g => g.id === id ? { ...g, done: !g.done } : g)
    setGoals(updated); lsSet('focus_goals_' + todayStr(), updated)
  }
  function removeGoal(id) {
    const updated = goals.filter(g => g.id !== id); setGoals(updated); lsSet('focus_goals_' + todayStr(), updated)
  }

  // ── Time Log ────────────────────────────────────────
  const [timeLog, setTimeLog]   = useState(() => lsGet('time_log', []))
  const [timeForm, setTimeForm] = useState({ project: '', task: '', duration: '', note: '' })
  const [logRunning, setLogRunning] = useState(false)
  const [logElapsed, setLogElapsed] = useState(0)
  const logRef = useRef(null)

  useEffect(() => {
    if (logRunning) { logRef.current = setInterval(() => setLogElapsed(e => e + 1), 1000) }
    return () => clearInterval(logRef.current)
  }, [logRunning])

  function stopStopwatch() {
    setLogRunning(false); clearInterval(logRef.current)
    setTimeForm(f => ({ ...f, duration: String(Math.round(logElapsed / 60)) }))
  }

  function logTime() {
    if (!timeForm.project.trim()) { showToast('Project name required', 'error'); return }
    const entry = { ...timeForm, id: newId(), date: todayStr(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    const updated = [entry, ...timeLog]; setTimeLog(updated); lsSet('time_log', updated)
    setTimeForm({ project: '', task: '', duration: '', note: '' }); setLogElapsed(0)
    showToast('Time logged!', 'success')
  }

  function deleteLog(id) {
    const updated = timeLog.filter(l => l.id !== id); setTimeLog(updated); lsSet('time_log', updated)
  }

  const todayLogs = timeLog.filter(l => l.date === todayStr())
  const totalMinsToday = todayLogs.reduce((s, l) => s + (parseInt(l.duration) || 0), 0)
  const elapsedFmt = `${String(Math.floor(logElapsed / 60)).padStart(2,'0')}:${String(logElapsed % 60).padStart(2,'0')}`

  // Build per-project breakdown for time log
  const projectBreakdown = todayLogs.reduce((acc, l) => {
    acc[l.project] = (acc[l.project] || 0) + (parseInt(l.duration) || 0); return acc
  }, {})

  // ── Standup ─────────────────────────────────────────
  const [standup, setStandup] = useState(() => lsGet('standup', { yesterday: '', today: '', blockers: '' }))
  const [standupHistory, setStandupHistory] = useState(() => lsGet('standup_history', []))

  function saveStandup() {
    const entry = { ...standup, date: todayStr(), savedAt: new Date().toISOString() }
    const history = [entry, ...standupHistory.filter(s => s.date !== todayStr())].slice(0, 14)
    setStandupHistory(history); lsSet('standup_history', history); lsSet('standup', standup)
    showToast('Standup saved!', 'success')
  }

  // ── Meetings ────────────────────────────────────────
  const [meetings, setMeetings]   = useState(() => lsGet('meetings', []))
  const [meetForm, setMeetForm]   = useState({ title: '', attendees: '', type: 'internal', agenda: '', notes: '', action: '' })
  const [meetModal, setMeetModal] = useState(false)
  const [expandedMeet, setExpandedMeet] = useState(null)

  function saveMeeting() {
    if (!meetForm.title.trim()) { showToast('Title required', 'error'); return }
    const entry = { ...meetForm, id: newId(), date: todayStr(), createdAt: new Date().toISOString() }
    const updated = [entry, ...meetings]; setMeetings(updated); lsSet('meetings', updated)
    setMeetForm({ title: '', attendees: '', type: 'internal', agenda: '', notes: '', action: '' })
    setMeetModal(false); showToast('Meeting saved!', 'success')
  }

  function deleteMeeting(id) {
    const updated = meetings.filter(m => m.id !== id); setMeetings(updated); lsSet('meetings', updated)
  }

  // ── Scratchpad ──────────────────────────────────────
  const [scratchpad, setScratchpad] = useState(() => lsGet('scratchpad', ''))

  // ── Dashboard derived ────────────────────────────────
  const allCards  = Object.values(kanban).flat().length
  const doneCards = kanban.done.length
  const activeProjCount = projects.filter(p => p.status === 'active').length

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard'  },
    { id: 'kanban',    icon: '🗂',  label: 'Kanban'     },
    { id: 'planner',   icon: '📅', label: 'Planner'    },
    { id: 'projects',  icon: '🚀', label: 'Projects'   },
    { id: 'invoices',  icon: '💰', label: 'Billing'    },
    { id: 'pomodoro',  icon: '🍅', label: 'Pomodoro'   },
    { id: 'timelog',   icon: '⏱',  label: 'Time Log'   },
    { id: 'standup',   icon: '📋', label: 'Standup'    },
    { id: 'meetings',  icon: '🤝', label: 'Meetings'   },
    { id: 'goals',     icon: '🎯', label: 'Goals'      },
    { id: 'scratch',   icon: '📝', label: 'Scratch'    },
  ]

  // ─────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Work Tools" subtitle="Your full productivity suite" />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: tab === t.id ? 'var(--acc)' : 'var(--bg3)', color: tab === t.id ? '#fff' : 'var(--txt2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          DASHBOARD
      ══════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { icon: '🎯', label: "Today's Goals",   value: `${goals.filter(g=>g.done).length}/${goals.length}`, sub: 'completed',              color: '#16a34a' },
              { icon: '⏱', label: 'Time Logged',      value: `${Math.floor(totalMinsToday/60)}h ${totalMinsToday%60}m`, sub: 'today',           color: '#2563eb' },
              { icon: '🚀', label: 'Active Projects',  value: activeProjCount,                                    sub: `of ${projects.length}`,  color: '#d97706' },
              { icon: '💰', label: 'Pending Revenue',  value: `$${totalPending.toLocaleString()}`,                sub: `$${totalEarned.toLocaleString()} earned`, color: '#9333ea' },
              { icon: '🍅', label: 'Focus Sessions',   value: pomSessions,                                        sub: `${pomSessions*customWork} mins`, color: '#dc2626' },
              { icon: '🗂', label: 'Kanban Cards',     value: `${doneCards}/${allCards}`,                         sub: 'done',                   color: '#0891b2' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${s.color}`, cursor: 'default' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Today goals quick view */}
          <div className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              🎯 Today's Goals
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('goals')}>View all →</button>
            </div>
            {goals.length === 0 && <div style={{ fontSize: 12, color: 'var(--txt3)' }}>No goals set. <span style={{ color: 'var(--acc3)', cursor: 'pointer' }} onClick={() => setTab('goals')}>Add some →</span></div>}
            {goals.slice(0, 4).map((g, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--bdr)' }}>
                <div onClick={() => toggleGoal(g.id)} style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${g.done ? 'var(--acc)' : 'var(--bdr)'}`, background: g.done ? 'var(--acc)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>{g.done ? '✓' : ''}</div>
                <span style={{ fontSize: 13, textDecoration: g.done ? 'line-through' : 'none', color: g.done ? 'var(--txt3)' : 'var(--txt)' }}>{i+1}. {g.text}</span>
              </div>
            ))}
          </div>

          {/* In Progress */}
          <div className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              ⚡ In Progress
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('kanban')}>Board →</button>
            </div>
            {kanban.doing.length === 0 && <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Nothing in progress.</div>}
            {kanban.doing.slice(0, 3).map(c => (
              <div key={c.id} style={{ padding: '6px 10px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLOR[c.priority], flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{c.text}</span>
                {c.tag && <span style={{ fontSize: 10, color: 'var(--txt3)', background: 'var(--bg4)', padding: '1px 6px', borderRadius: 4 }}>{c.tag}</span>}
              </div>
            ))}
          </div>

          {/* Upcoming deadlines */}
          {projects.filter(p => p.deadline && p.status === 'active').length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>⏰ Upcoming Deadlines</div>
              {projects.filter(p => p.deadline && p.status === 'active')
                .sort((a, b) => a.deadline > b.deadline ? 1 : -1)
                .slice(0, 4)
                .map(p => {
                  const daysLeft = Math.ceil((new Date(p.deadline) - new Date()) / 86400000)
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--bdr)' }}>
                      <span style={{ fontSize: 13 }}>{p.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: daysLeft <= 3 ? '#dc2626' : 'var(--txt2)' }}>
                        {daysLeft <= 0 ? '🔴 Overdue' : `${daysLeft}d left`}
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          KANBAN
      ══════════════════════════════════════ */}
      {tab === 'kanban' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {KANBAN_COLS.map(col => (
              <div key={col.id}
                style={{ background: 'var(--bg2)', borderRadius: 12, padding: 10, border: '1px solid var(--bdr)', minHeight: 160 }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  if (dragCard && dragFrom !== col.id) { moveCard(dragFrom, col.id, dragCard) }
                  setDragCard(null); setDragFrom(null)
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--bg4)', padding: '1px 6px', borderRadius: 8 }}>{(kanban[col.id] || []).length}</span>
                    <button onClick={() => setAddingCol(col.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: col.color, fontSize: 20, lineHeight: 1, padding: 0 }}>+</button>
                  </div>
                </div>

                {addingCol === col.id && (
                  <div style={{ marginBottom: 8, background: 'var(--bg3)', borderRadius: 8, padding: 8 }}>
                    <input className="inp" autoFocus placeholder="Card title…" value={kanbanForm.text}
                      onChange={e => setKanbanForm(f => ({ ...f, text: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addCard(col.id); if (e.key === 'Escape') setAddingCol(null) }}
                      style={{ marginBottom: 6, fontSize: 12 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                      <input className="inp" placeholder="Tag" value={kanbanForm.tag}
                        onChange={e => setKanbanForm(f => ({ ...f, tag: e.target.value }))} style={{ fontSize: 11 }} />
                      <select className="inp" value={kanbanForm.priority}
                        onChange={e => setKanbanForm(f => ({ ...f, priority: e.target.value }))} style={{ fontSize: 11 }}>
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Med</option>
                        <option value="high">🔴 High</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => addCard(col.id)}>Add</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAddingCol(null)}>✕</button>
                    </div>
                  </div>
                )}

                {(kanban[col.id] || []).map(card => (
                  <div key={card.id} draggable
                    onDragStart={() => { setDragCard(card.id); setDragFrom(col.id) }}
                    style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px', marginBottom: 6, cursor: 'grab', borderLeft: `3px solid ${PRIORITY_COLOR[card.priority]}` }}>
                    <div style={{ fontSize: 12, color: 'var(--txt)', marginBottom: 5, lineHeight: 1.4 }}>{card.text}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {card.tag && <span style={{ fontSize: 10, color: 'var(--txt3)', background: 'var(--bg4)', padding: '1px 5px', borderRadius: 4 }}>{card.tag}</span>}
                      </div>
                      <button onClick={() => deleteCard(col.id, card.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 14, padding: 0 }}>×</button>
                    </div>
                    {/* Move to other cols */}
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {KANBAN_COLS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveCard(col.id, c.id, card.id)}
                          style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, border: `1px solid ${c.color}`, background: 'none', cursor: 'pointer', color: c.color }}>
                          → {c.label.split(' ').slice(1).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          WEEKLY PLANNER
      ══════════════════════════════════════ */}
      {tab === 'planner' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 14 }}>Plan your week. Click "+ Add" to add tasks per day.</div>
          {DAYS.map(day => {
            const items = weekPlan[day] || []
            const doneCount = items.filter(i => i.done).length
            return (
              <div key={day} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${editingDay === day ? 'var(--acc)' : 'var(--bdr)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, minWidth: 34 }}>{day}</span>
                    {items.length > 0 && (
                      <>
                        <span style={{ fontSize: 11, color: doneCount === items.length ? '#16a34a' : 'var(--txt3)' }}>{doneCount}/{items.length}</span>
                        <div style={{ width: 50, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--acc)', width: `${(doneCount/items.length)*100}%`, borderRadius: 2 }} />
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => { setEditingDay(editingDay === day ? null : day); setDayInput('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--acc3)', fontSize: 12, padding: '2px 6px' }}>
                    {editingDay === day ? '▲ Close' : '+ Add'}
                  </button>
                </div>

                {items.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {items.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                        <div onClick={() => toggleDayItem(day, item.id)}
                          style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${item.done ? 'var(--acc)' : 'var(--bdr)'}`, background: item.done ? 'var(--acc)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>
                          {item.done ? '✓' : ''}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--txt3)' : 'var(--txt)' }}>{item.text}</span>
                        <button onClick={() => deleteDayItem(day, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 14, padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {editingDay === day && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input className="inp" autoFocus placeholder={`Add task for ${day}…`} value={dayInput}
                      onChange={e => setDayInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addDayItem(day); if (e.key === 'Escape') setEditingDay(null) }}
                      style={{ fontSize: 13 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => addDayItem(day)}>+</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          PROJECTS
      ══════════════════════════════════════ */}
      {tab === 'projects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(PROJ_STATUS).map(([k, v]) => (
                <span key={k} style={{ fontSize: 12, color: v.color }}>{v.label}: {projects.filter(p => p.status === k).length}</span>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setProjModal(true)}>+ New Project</button>
          </div>

          {projects.length === 0 && <EmptyState icon="🚀" title="No projects yet" sub="Track clients, deadlines & progress" />}

          {projects.map(p => (
            <div key={p.id} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${PROJ_STATUS[p.status]?.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {p.client   && <span>👤 {p.client}</span>}
                    {p.deadline && <span>📅 {p.deadline}</span>}
                    <span style={{ color: PROJ_STATUS[p.status]?.color, fontWeight: 600 }}>{PROJ_STATUS[p.status]?.label}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt2)', marginBottom: 3 }}>
                      <span>Progress</span><span style={{ fontWeight: 600 }}>{p.progress}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={p.progress} onChange={e => updateProjProgress(p.id, e.target.value)} style={{ width: '100%' }} />
                    <div style={{ background: 'var(--bg4)', borderRadius: 4, height: 5, overflow: 'hidden', marginTop: 2 }}>
                      <div style={{ background: p.progress >= 100 ? '#16a34a' : 'var(--acc)', height: '100%', width: `${p.progress}%`, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setExpandedProj(expandedProj === p.id ? null : p.id)}>{expandedProj === p.id ? '▲' : '▼'}</button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteProject(p.id)}>🗑</button>
                </div>
              </div>

              {expandedProj === p.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bdr)' }}>
                  <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 6 }}>Change status:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: p.notes ? 10 : 0 }}>
                    {Object.entries(PROJ_STATUS).map(([k, v]) => (
                      <button key={k} onClick={() => updateProjStatus(p.id, k)}
                        style={{ padding: '4px 10px', borderRadius: 8, border: `2px solid ${p.status === k ? v.color : 'var(--bdr)'}`, background: p.status === k ? v.color + '22' : 'var(--bg3)', cursor: 'pointer', fontSize: 11, color: v.color }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: 'var(--txt2)', whiteSpace: 'pre-wrap', marginTop: 8 }}>{p.notes}</div>}
                </div>
              )}
            </div>
          ))}

          {/* New Project Modal */}
          {projModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
              onClick={e => { if (e.target === e.currentTarget) setProjModal(false) }}>
              <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🚀 New Project</div>
                {[['Project Name *','name','text'],['Client / Stakeholder','client','text'],['Deadline','deadline','date']].map(([lbl,key,type]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>{lbl}</label>
                    <input className="inp" type={type} placeholder={lbl} value={projForm[key]} onChange={e => setProjForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Status</label>
                  <select className="inp" value={projForm.status} onChange={e => setProjForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(PROJ_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Initial Progress: {projForm.progress}%</label>
                  <input type="range" min="0" max="100" value={projForm.progress} onChange={e => setProjForm(f => ({ ...f, progress: e.target.value }))} style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Notes</label>
                  <textarea className="inp" placeholder="Goals, description…" value={projForm.notes} onChange={e => setProjForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProject}>Save Project</button>
                  <button className="btn btn-ghost" onClick={() => setProjModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          BILLING / INVOICES
      ══════════════════════════════════════ */}
      {tab === 'invoices' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Earned',   value: `$${totalEarned.toLocaleString()}`,  color: '#16a34a' },
              { label: 'Pending',  value: `$${totalPending.toLocaleString()}`, color: '#d97706' },
              { label: 'Invoices', value: invoices.length,                     color: 'var(--acc3)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-value" style={{ fontSize: 18, color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setInvModal(true)}>+ New Invoice</button>
          </div>

          {invoices.length === 0 && <EmptyState icon="💰" title="No invoices yet" sub="Track client payments & revenue" />}

          {invoices.map(inv => (
            <div key={inv.id} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${INV_STATUS[inv.status]?.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--txt3)' }}>{inv.invoiceNo}</span>
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 6, background: INV_STATUS[inv.status]?.color + '22', color: INV_STATUS[inv.status]?.color, fontWeight: 600 }}>{INV_STATUS[inv.status]?.label}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.client}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
                    {inv.date}{inv.due && ` · Due: ${inv.due}`}{inv.description && ` · ${inv.description}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: inv.status === 'paid' ? '#16a34a' : 'var(--acc3)' }}>{inv.currency} {Number(inv.amount).toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
                    {inv.status !== 'paid' && <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: '#16a34a' }} onClick={() => markInvPaid(inv.id)}>✓ Mark Paid</button>}
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteInvoice(inv.id)}>🗑</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* New Invoice Modal */}
          {invModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
              onClick={e => { if (e.target === e.currentTarget) setInvModal(false) }}>
              <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💰 New Invoice</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Client *</label>
                    <input className="inp" placeholder="Client name" value={invForm.client} onChange={e => setInvForm(f => ({ ...f, client: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Currency</label>
                    <select className="inp" value={invForm.currency} onChange={e => setInvForm(f => ({ ...f, currency: e.target.value }))}>
                      {['USD','EUR','GBP','INR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Amount *</label>
                    <input className="inp" type="number" placeholder="0.00" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Due Date</label>
                    <input className="inp" type="date" value={invForm.due} onChange={e => setInvForm(f => ({ ...f, due: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Status</label>
                  <select className="inp" value={invForm.status} onChange={e => setInvForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(INV_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Description</label>
                  <input className="inp" placeholder="e.g. Website dev – March" value={invForm.description} onChange={e => setInvForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveInvoice}>Save Invoice</button>
                  <button className="btn btn-ghost" onClick={() => setInvModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          POMODORO
      ══════════════════════════════════════ */}
      {tab === 'pomodoro' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[{ label:'Sessions', value:pomSessions },{ label:'Focus Time', value:`${pomSessions*customWork}m` },{ label:'Mode', value:pomMode }].map(s => (
              <div key={s.label} className="stat-card" style={{ flex:1, textAlign:'center' }}>
                <div className="stat-value" style={{ fontSize:20 }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Optional task label */}
          <div style={{ marginBottom: 12 }}>
            <input className="inp" placeholder="What are you focusing on? (optional)" value={pomTask} onChange={e => setPomTask(e.target.value)} style={{ fontSize: 13 }} />
          </div>

          <div className="card" style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:20 }}>
              {[['work','🎯 Focus'],['break','☕ Short Break'],['long','🌿 Long Break']].map(([m,lbl]) => (
                <button key={m} onClick={() => switchPomMode(m)}
                  style={{ padding:'6px 12px', borderRadius:10, border:`2px solid ${pomMode===m?'var(--acc)':'var(--bdr)'}`, background:pomMode===m?'var(--acc)':'var(--bg3)', color:pomMode===m?'#fff':'var(--txt2)', cursor:'pointer', fontSize:12, fontWeight:500 }}>
                  {lbl}
                </button>
              ))}
            </div>
            {pomTask && <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:12, fontStyle:'italic' }}>Working on: {pomTask}</div>}
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:64, fontWeight:700, color:pomRunning?'var(--acc3)':'var(--txt)', letterSpacing:4, lineHeight:1, marginBottom:6 }}>{pomMins}:{pomSecs}</div>
            <div style={{ fontSize:12, color:'var(--txt3)', marginBottom:16 }}>{pomMode==='work'?`${customWork} min focus`:pomMode==='break'?`${customBreak} min break`:`${customLong} min long break`}</div>
            <div style={{ background:'var(--bg4)', borderRadius:6, height:8, marginBottom:24, overflow:'hidden' }}>
              <div style={{ background:'var(--acc)', height:'100%', borderRadius:6, width:`${pomPct}%`, transition:'width 1s linear' }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-primary" onClick={() => setPomRunning(r=>!r)} style={{ minWidth:110, fontSize:16 }}>{pomRunning?'⏸ Pause':'▶ Start'}</button>
              <button className="btn btn-ghost" onClick={() => { setPomRunning(false); clearInterval(timerRef.current); switchPomMode(pomMode) }}>↺ Reset</button>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPomSettings(s=>!s)}>⚙️</button>
            </div>
          </div>

          {showPomSettings && (
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>⚙️ Timer Settings</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[['Focus (min)',customWork,setCustomWork],['Short Break',customBreak,setCustomBreak],['Long Break',customLong,setCustomLong]].map(([lbl,val,set]) => (
                  <div key={lbl}><div style={{ fontSize:11, color:'var(--txt2)', marginBottom:4 }}>{lbl}</div>
                  <input className="inp" type="number" min="1" max="120" value={val} onChange={e=>set(+e.target.value)} style={{ textAlign:'center' }} /></div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button className="btn btn-primary btn-sm" onClick={savePomSettings}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPomSettings(false)}>Cancel</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setPomSessions(0); lsSet('pom_sessions',0); showToast('Sessions reset','success') }}>Reset Sessions</button>
              </div>
            </div>
          )}

          {pomSessions > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {Array.from({ length: Math.min(pomSessions, 16) }).map((_,i) => (
                <div key={i} style={{ width:12, height:12, borderRadius:'50%', background:i%4===3?'var(--acc3)':'var(--acc)', opacity:0.8 }} />
              ))}
              {pomSessions > 16 && <span style={{ fontSize:12, color:'var(--txt2)' }}>+{pomSessions-16} more</span>}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TIME LOG
      ══════════════════════════════════════ */}
      {tab === 'timelog' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            {[{ label:'Today', value:`${Math.floor(totalMinsToday/60)}h ${totalMinsToday%60}m` },{ label:'Entries', value:todayLogs.length }].map(s => (
              <div key={s.label} className="stat-card" style={{ flex:1 }}>
                <div className="stat-value" style={{ fontSize:20 }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-project breakdown */}
          {Object.keys(projectBreakdown).length > 0 && (
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>Today by Project</div>
              {Object.entries(projectBreakdown).map(([proj, mins]) => (
                <div key={proj} style={{ marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:2 }}>
                    <span style={{ color:'var(--txt)' }}>{proj}</span>
                    <span style={{ color:'var(--acc3)', fontWeight:600 }}>{Math.floor(mins/60)}h {mins%60}m</span>
                  </div>
                  <div style={{ background:'var(--bg4)', borderRadius:3, height:4, overflow:'hidden' }}>
                    <div style={{ background:'var(--acc)', height:'100%', width:`${Math.min(100,(mins/totalMinsToday)*100)}%`, borderRadius:3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ textAlign:'center', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--txt2)', marginBottom:6 }}>STOPWATCH</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:40, fontWeight:700, color:logRunning?'var(--acc3)':'var(--txt)', marginBottom:10 }}>{elapsedFmt}</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {!logRunning
                ? <button className="btn btn-primary btn-sm" onClick={() => { setLogRunning(true); setLogElapsed(0) }}>▶ Start</button>
                : <button className="btn btn-ghost btn-sm" style={{ color:'var(--acc3)' }} onClick={stopStopwatch}>⏹ Stop & Fill</button>}
              {logElapsed > 0 && !logRunning && <button className="btn btn-ghost btn-sm" onClick={() => setLogElapsed(0)}>↺</button>}
            </div>
          </div>

          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>+ Log Time</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:11, color:'var(--txt2)', marginBottom:4 }}>Project *</div><input className="inp" placeholder="Project name" value={timeForm.project} onChange={e=>setTimeForm(f=>({...f,project:e.target.value}))} /></div>
              <div><div style={{ fontSize:11, color:'var(--txt2)', marginBottom:4 }}>Task</div><input className="inp" placeholder="Task description" value={timeForm.task} onChange={e=>setTimeForm(f=>({...f,task:e.target.value}))} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:11, color:'var(--txt2)', marginBottom:4 }}>Duration (min)</div><input className="inp" type="number" placeholder="30" value={timeForm.duration} onChange={e=>setTimeForm(f=>({...f,duration:e.target.value}))} /></div>
              <div><div style={{ fontSize:11, color:'var(--txt2)', marginBottom:4 }}>Note</div><input className="inp" placeholder="Optional note…" value={timeForm.note} onChange={e=>setTimeForm(f=>({...f,note:e.target.value}))} /></div>
            </div>
            <button className="btn btn-primary w-full" onClick={logTime}>💾 Log Entry</button>
          </div>

          {todayLogs.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:8 }}>Today's Entries</div>
              {todayLogs.map(l => (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg3)', borderRadius:10, marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{l.project}{l.task && <span style={{ color:'var(--txt2)', fontWeight:400 }}> · {l.task}</span>}</div>
                    <div style={{ fontSize:11, color:'var(--txt3)' }}>{l.time}{l.note && ` · ${l.note}`}</div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--acc3)', whiteSpace:'nowrap' }}>{l.duration}m</span>
                  <button onClick={() => deleteLog(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt3)', fontSize:16, padding:0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          STANDUP
      ══════════════════════════════════════ */}
      {tab === 'standup' && (
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>📋 Daily Standup — {todayStr()}</div>
            {[
              { label:'✅ Yesterday', key:'yesterday', ph:'What did you complete yesterday?' },
              { label:'🎯 Today',     key:'today',     ph:'What will you work on today?' },
              { label:'🚧 Blockers',  key:'blockers',  ph:'Any blockers or impediments?' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--txt2)', display:'block', marginBottom:5 }}>{f.label}</label>
                <textarea className="inp" placeholder={f.ph} value={standup[f.key]} onChange={e=>setStandup(s=>({...s,[f.key]:e.target.value}))} rows={2} />
              </div>
            ))}
            <button className="btn btn-primary w-full" onClick={saveStandup}>💾 Save Standup</button>
          </div>

          {standupHistory.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:8 }}>Recent Standups</div>
              {standupHistory.slice(0,5).map(s => (
                <div key={s.date} className="card" style={{ marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--acc3)', marginBottom:6 }}>📅 {s.date}</div>
                  {s.yesterday && <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:3 }}><strong>Yesterday:</strong> {s.yesterday}</div>}
                  {s.today     && <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:3 }}><strong>Today:</strong> {s.today}</div>}
                  {s.blockers  && <div style={{ fontSize:12, color:'var(--acc3)' }}><strong>Blockers:</strong> {s.blockers}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          MEETINGS
      ══════════════════════════════════════ */}
      {tab === 'meetings' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:13, color:'var(--txt2)' }}>{meetings.length} meetings saved</div>
            <button className="btn btn-primary btn-sm" onClick={() => setMeetModal(true)}>+ New Meeting</button>
          </div>

          {meetings.length === 0 && <EmptyState icon="🤝" title="No meetings yet" sub="Log your first meeting" />}

          {meetings.map(m => (
            <div key={m.id} className="card" style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>🤝 {m.title}</div>
                  <div style={{ fontSize:11, color:'var(--txt3)', display:'flex', gap:10, flexWrap:'wrap' }}>
                    <span>📅 {m.date}</span>
                    {m.attendees && <span>👥 {m.attendees}</span>}
                    {m.type && <span style={{ background:'var(--bg4)', padding:'1px 6px', borderRadius:4 }}>{m.type}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setExpandedMeet(expandedMeet===m.id?null:m.id)}>{expandedMeet===m.id?'▲':'▼'}</button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteMeeting(m.id)}>🗑</button>
                </div>
              </div>
              {expandedMeet === m.id && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--bdr)' }}>
                  {m.agenda && <div style={{ marginBottom:8 }}><div style={{ fontSize:11, fontWeight:700, color:'var(--txt2)', marginBottom:3 }}>AGENDA</div><div style={{ fontSize:13, whiteSpace:'pre-wrap' }}>{m.agenda}</div></div>}
                  {m.notes  && <div style={{ marginBottom:8 }}><div style={{ fontSize:11, fontWeight:700, color:'var(--txt2)', marginBottom:3 }}>NOTES</div><div style={{ fontSize:13, whiteSpace:'pre-wrap' }}>{m.notes}</div></div>}
                  {m.action && <div><div style={{ fontSize:11, fontWeight:700, color:'var(--acc3)', marginBottom:3 }}>ACTION ITEMS</div><div style={{ fontSize:13, whiteSpace:'pre-wrap' }}>{m.action}</div></div>}
                </div>
              )}
            </div>
          ))}

          {meetModal && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
              onClick={e => { if(e.target===e.currentTarget) setMeetModal(false) }}>
              <div style={{ background:'var(--bg2)', borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto' }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>🤝 New Meeting</div>
                {[
                  { label:'Title *',        key:'title',     ph:'Meeting title', rows:1 },
                  { label:'Attendees',       key:'attendees', ph:'Ram, Priya, John', rows:1 },
                  { label:'Agenda',          key:'agenda',    ph:'Meeting agenda…', rows:3 },
                  { label:'Notes',           key:'notes',     ph:'Notes during meeting…', rows:4 },
                  { label:'✅ Action Items', key:'action',    ph:'Follow-up tasks…', rows:3 },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:12 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--txt2)', display:'block', marginBottom:5 }}>{f.label}</label>
                    {f.rows===1
                      ? <input className="inp" placeholder={f.ph} value={meetForm[f.key]} onChange={e=>setMeetForm(fm=>({...fm,[f.key]:e.target.value}))} />
                      : <textarea className="inp" placeholder={f.ph} value={meetForm[f.key]} onChange={e=>setMeetForm(fm=>({...fm,[f.key]:e.target.value}))} rows={f.rows} />}
                  </div>
                ))}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--txt2)', display:'block', marginBottom:5 }}>Meeting Type</label>
                  <select className="inp" value={meetForm.type} onChange={e=>setMeetForm(fm=>({...fm,type:e.target.value}))}>
                    {['internal','client','1:1','sprint','review','other'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={saveMeeting}>Save Meeting</button>
                  <button className="btn btn-ghost" onClick={() => setMeetModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          GOALS
      ══════════════════════════════════════ */}
      {tab === 'goals' && (
        <div>
          <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:14 }}>
            🗓 {todayStr()} — <strong style={{ color:'var(--txt)' }}>{goals.filter(g=>g.done).length}/{goals.length}</strong> done
          </div>
          {goals.length > 0 && (
            <div style={{ background:'var(--bg4)', borderRadius:6, height:6, marginBottom:16, overflow:'hidden' }}>
              <div style={{ background:'var(--acc)', height:'100%', borderRadius:6, width:`${goals.length?(goals.filter(g=>g.done).length/goals.length)*100:0}%`, transition:'width 0.3s' }} />
            </div>
          )}
          {goals.length === 0 && <EmptyState icon="🎯" title="No goals yet" sub="Set your top 3 priorities for today" />}
          {goals.map((g, i) => (
            <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:g.done?'var(--bg2)':'var(--bg3)', borderRadius:10, marginBottom:6, border:`1px solid ${g.done?'var(--bdr)':'var(--acc)33'}` }}>
              <div onClick={() => toggleGoal(g.id)} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${g.done?'var(--acc)':'var(--bdr)'}`, background:g.done?'var(--acc)':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, color:'#fff', fontWeight:700 }}>{g.done?'✓':''}</div>
              <span style={{ flex:1, fontSize:14, fontWeight:500, textDecoration:g.done?'line-through':'none', color:g.done?'var(--txt3)':'var(--txt)' }}>{i+1}. {g.text}</span>
              <button onClick={() => removeGoal(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt3)', fontSize:16, padding:0 }}>×</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <input className="inp" placeholder="Add a focus goal for today…" value={newGoal} onChange={e=>setNewGoal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addGoal()}} />
            <button className="btn btn-primary" onClick={addGoal}>+</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SCRATCHPAD
      ══════════════════════════════════════ */}
      {tab === 'scratch' && (
        <div>
          <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:10 }}>📝 Quick scratchpad — auto-saved as you type</div>
          <textarea className="inp" placeholder="Brain dump, quick notes, temp calculations…" value={scratchpad}
            onChange={e => { setScratchpad(e.target.value); lsSet('scratchpad', e.target.value) }}
            style={{ width:'100%', minHeight:360, fontFamily:'JetBrains Mono, monospace', fontSize:13, lineHeight:1.8, resize:'vertical' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <span style={{ fontSize:11, color:'var(--txt3)' }}>{scratchpad.length} chars · {scratchpad.split('\n').filter(Boolean).length} lines</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { setScratchpad(''); lsSet('scratchpad','') }}>🗑 Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
