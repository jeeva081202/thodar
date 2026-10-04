import { useMemo } from 'react'
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Avatar from './Avatar'

const X_GAP = 200
const Y_GAP = 115

// Simple tree layout: leaves ku left→right x, parent = children naduvula
function layout(parts) {
  const children = {}
  let root = null
  parts.forEach((p) => {
    if (p.parent == null) root = p
    else (children[p.parent] ||= []).push(p)
  })
  const pos = {}
  let nextX = 0
  const walk = (p, depth) => {
    const kids = children[p.id] || []
    if (!kids.length) pos[p.id] = { x: nextX++ * X_GAP, y: depth * Y_GAP }
    else {
      kids.forEach((k) => walk(k, depth + 1))
      const xs = kids.map((k) => pos[k.id].x)
      pos[p.id] = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: depth * Y_GAP }
    }
  }
  if (root) walk(root, 0)
  return pos
}

function PartNode({ data }) {
  const { part, selected, onPath } = data
  return (
    <div className={`tnode ${onPath ? 'on-path' : ''} ${selected ? 'selected' : ''} ${part.is_ending ? 'ending' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="tnode-head"><Avatar name={part.author} src={part.author_avatar} size={18} /> @{part.author}</div>
      <div className="tnode-text">{part.content.slice(0, 52)}…</div>
      <div className="tnode-meta"><span>{Object.keys(part.reactions || {}).slice(0, 2).join('') || '♥'} {part.likes_count}</span>{part.is_ending && <span>🏁</span>}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = { part: PartNode }

export default function StoryTree({ parts, selectedId, pathIds, onSelect }) {
  const { nodes, edges } = useMemo(() => {
    const pos = layout(parts)
    const onPath = new Set(pathIds)
    return {
      nodes: parts.map((p) => ({
        id: String(p.id), type: 'part', position: pos[p.id] || { x: 0, y: 0 },
        data: { part: p, selected: p.id === selectedId, onPath: onPath.has(p.id) },
      })),
      edges: parts.filter((p) => p.parent).map((p) => ({
        id: `e${p.parent}-${p.id}`, source: String(p.parent), target: String(p.id),
        animated: onPath.has(p.id),
        style: { stroke: onPath.has(p.id) ? 'rgb(var(--c2))' : 'var(--border-strong)', strokeWidth: onPath.has(p.id) ? 2.5 : 1.5 },
      })),
    }
  }, [parts, selectedId, pathIds])

  return (
    <div className="tree-box">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView
                 nodesDraggable={false} nodesConnectable={false}
                 fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
                 onNodeClick={(_, n) => onSelect(Number(n.id))} proOptions={{ hideAttribution: true }}>
        <Background color="var(--canvas-dot)" gap={22} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
