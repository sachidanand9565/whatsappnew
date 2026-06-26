'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  addEdge, Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState,
  Connection, Edge, Node, NodeTypes, ReactFlowInstance,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { apiFetch } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Zap, ToggleLeft, ToggleRight,
  Plus, MessageSquare, GitBranch, Globe, Tag, X, Trash2,
  HelpCircle, Image, List, Clock, TagIcon, UserCheck, ArrowRightCircle,
} from 'lucide-react';

import StartNode        from './nodes/StartNode';
import MessageNode      from './nodes/MessageNode';
import ConditionNode    from './nodes/ConditionNode';
import ApiNode          from './nodes/ApiNode';
import SetAttrNode      from './nodes/SetAttrNode';
import EndNode          from './nodes/EndNode';
import AskQuestionNode  from './nodes/AskQuestionNode';
import SendMediaNode    from './nodes/SendMediaNode';
import ListMessageNode  from './nodes/ListMessageNode';
import DelayNode        from './nodes/DelayNode';
import AddTagNode       from './nodes/AddTagNode';
import TransferAgentNode from './nodes/TransferAgentNode';
import ConnectFlowNode  from './nodes/ConnectFlowNode';
import ButtonEdge       from './edges/ButtonEdge';
import NodePanel        from './NodePanel';

const EDGE_TYPES = {
  button: ButtonEdge,
};

const NODE_TYPES: NodeTypes = {
  start:          StartNode,
  message:        MessageNode,
  condition:      ConditionNode,
  api:            ApiNode,
  set_attr:       SetAttrNode,
  end:            EndNode,
  ask_question:   AskQuestionNode,
  send_media:     SendMediaNode,
  list_message:   ListMessageNode,
  delay:          DelayNode,
  add_tag:        AddTagNode,
  transfer_agent: TransferAgentNode,
  connect_flow:   ConnectFlowNode,
};

const PALETTE = [
  {
    group: 'Messages',
    items: [
      { type: 'message',      label: 'Text Message',   icon: MessageSquare,     color: '#25D366', desc: 'Send text + buttons' },
      { type: 'send_media',   label: 'Send Media',     icon: Image,             color: '#EC4899', desc: 'Image, video, doc'   },
      { type: 'list_message', label: 'List Message',   icon: List,              color: '#14B8A6', desc: 'WhatsApp list menu'  },
      { type: 'ask_question', label: 'Ask Question',   icon: HelpCircle,        color: '#06B6D4', desc: 'Ask & save reply'    },
    ],
  },
  {
    group: 'Logic',
    items: [
      { type: 'condition',    label: 'Condition',      icon: GitBranch,         color: '#3B82F6', desc: 'If/else branching'   },
      { type: 'delay',        label: 'Delay',          icon: Clock,             color: '#64748B', desc: 'Wait X seconds'      },
      { type: 'connect_flow', label: 'Connect Flow',   icon: ArrowRightCircle,  color: '#84CC16', desc: 'Jump to another flow'},
    ],
  },
  {
    group: 'Actions',
    items: [
      { type: 'api',          label: 'API Request',    icon: Globe,             color: '#8B5CF6', desc: 'Call external API'   },
      { type: 'set_attr',     label: 'Set Attribute',  icon: Tag,               color: '#F59E0B', desc: 'Save contact data'   },
      { type: 'add_tag',      label: 'Add Tag',        icon: TagIcon,           color: '#F97316', desc: 'Tag the contact'     },
      { type: 'transfer_agent', label: 'Transfer Agent', icon: UserCheck,       color: '#6366F1', desc: 'Hand off to human'   },
    ],
  },
  {
    group: 'End',
    items: [
      { type: 'end',          label: 'End Flow',       icon: X,                 color: '#EF4444', desc: 'End conversation'    },
    ],
  },
];

let nodeIdCounter = 100;
function newId() { return `node_${++nodeIdCounter}`; }

export default function FlowBuilderPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance]      = useState<ReactFlowInstance | null>(null);

  const [flow, setFlow]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [selected, setSelected]   = useState<Node | null>(null);
  const [keywords, setKeywords]   = useState<string[]>([]);
  const [kwInput, setKwInput]     = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPalette, setShowPalette]   = useState(false);

  // Load flow
  useEffect(() => {
    apiFetch(`/api/flows/${id}`).then(r => {
      if (!r?.data) { router.push('/flows'); return; }
      const f = r.data;
      setFlow(f);
      setKeywords(f.trigger_keywords || []);

      // Load saved nodes/edges
      const savedNodes = f.nodes && Object.keys(f.nodes).length > 0
        ? Object.values(f.nodes) as Node[]
        : [defaultStartNode()];
      const savedEdges = Array.isArray(f.edges) ? f.edges : [];
      setNodes(savedNodes);
      setEdges(savedEdges.map((e: Edge) => ({
        ...e,
        type: e.type || 'button',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
        style: { stroke: '#38bdf8', strokeWidth: 2 },
      })));

      // Avoid generating duplicate IDs for new nodes after reload
      savedNodes.forEach(n => {
        const match = /^node_(\d+)$/.exec(n.id);
        if (match) nodeIdCounter = Math.max(nodeIdCounter, parseInt(match[1], 10));
      });
    }).finally(() => setLoading(false));
  }, [id]);

  function defaultStartNode(): Node {
    return {
      id: 'start',
      type: 'start',
      position: { x: 80, y: 200 },
      data: { label: 'Flow Start', keywords: [] },
    };
  }

  // Connect nodes
  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => addEdge({
      ...conn,
      type: 'button',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
      style: { stroke: '#38bdf8', strokeWidth: 2 },
    }, eds));
  }, []);

  // Add node from palette
  function addNode(type: string) {
    const pos = rfInstance?.project({ x: 350, y: 150 + nodes.length * 80 }) || { x: 350, y: 200 };
    const id  = newId();
    const newNode: Node = {
      id,
      type,
      position: pos,
      data: defaultData(type, id),
    };
    setNodes(ns => [...ns, newNode]);
  }

  function defaultData(type: string, id: string) {
    if (type === 'message')        return { label: 'Message',        text: '', buttons: [] };
    if (type === 'condition')      return { label: 'Condition',      variable: '', operator: 'equals', value: '' };
    if (type === 'api')            return { label: 'API Request',    url: '', method: 'GET', save_as: '' };
    if (type === 'set_attr')       return { label: 'Set Attribute',  attribute: '', value: '' };
    if (type === 'end')            return { label: 'End Flow' };
    if (type === 'ask_question')   return { label: 'Ask Question',   question: '', save_as: '', validation: 'any' };
    if (type === 'send_media')     return { label: 'Send Media',     media_type: 'image', url: '', caption: '' };
    if (type === 'list_message')   return { label: 'List Message',   body: '', button_text: 'Choose', sections: [] };
    if (type === 'delay')          return { label: 'Delay',          duration: 5, unit: 'seconds' };
    if (type === 'add_tag')        return { label: 'Add Tag',        tags: [] };
    if (type === 'transfer_agent') return { label: 'Transfer Agent', message: 'Connecting you to an agent...' };
    if (type === 'connect_flow')   return { label: 'Connect Flow',   flow_id: '', flow_name: '' };
    return { label: type };
  }

  // Save
  async function save() {
    setSaving(true);
    const nodesMap: Record<string, Node> = {};
    nodes.forEach(n => { nodesMap[n.id] = n; });

    const r = await apiFetch(`/api/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nodes: nodesMap,
        edges,
        trigger_keywords: keywords,
      }),
    });
    if (r?.data?.ok) toast.success('Flow saved!');
    else toast.error('Save failed');
    setSaving(false);
  }

  // Toggle active
  async function toggleActive() {
    await apiFetch(`/api/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: !flow?.is_active }),
    });
    setFlow((f: any) => ({ ...f, is_active: !f.is_active }));
    toast.success(flow?.is_active ? 'Flow deactivated' : 'Flow activated!');
  }

  // Node click
  function onNodeClick(_: any, node: Node) { setSelected(node); }
  function onPaneClick() { setSelected(null); }

  // Update node data from panel
  function updateNodeData(nodeId: string, data: any) {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
  }

  function deleteNode(nodeId: string) {
    if (nodeId === 'start') { toast.error("Can't delete start node"); return; }
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelected(null);
  }

  function addKeyword() {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) return;
    setKeywords(k => [...k, kw]);
    setKwInput('');
  }

  if (loading) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1120]">
      <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0b1120]">

      {/* Top Bar */}
      <div className="bg-[#0f172a] border-b border-white/[0.07] z-30 px-3 py-2 flex items-center justify-between h-14 md:h-16 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button onClick={() => router.push('/flows')}
            className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 flex-shrink-0 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-slate-100 text-xs sm:text-sm md:text-base truncate leading-tight">
              {flow?.name || 'Flow Builder'}
            </h1>
            <p className="text-[9px] text-slate-500 font-semibold tracking-wide mt-0.5 hidden sm:block">
              {nodes.length} nodes · {edges.length} connections
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Keywords triggers button */}
          <button onClick={() => setShowSettings(true)}
            className="flex items-center justify-center gap-1.5 text-xs border border-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-white/5 text-slate-300 font-semibold transition-colors"
            title={`Triggers: ${keywords.length}`}
          >
            <Zap size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="hidden sm:inline">Triggers</span>
            <span className="bg-white/10 text-slate-200 px-1 py-0.5 rounded text-[9px] font-bold">
              {keywords.length}
            </span>
          </button>

          {/* Active toggle */}
          <button onClick={toggleActive}
            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition-colors ${
              flow?.is_active
                ? 'bg-green-500/15 border-green-500/30 text-green-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            title={flow?.is_active ? 'Active' : 'Inactive'}
          >
            {flow?.is_active ? (
              <>
                <ToggleRight size={16} className="text-green-600" />
                <span className="hidden sm:inline">Active</span>
              </>
            ) : (
              <>
                <ToggleLeft size={16} />
                <span className="hidden sm:inline">Inactive</span>
              </>
            )}
          </button>

          {/* Save Button */}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-60 transition-colors shadow-sm"
          >
            <Save size={13} />
            <span>{saving ? 'Saving' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Palette (Sliding panel on mobile, standard sidebar on desktop) */}
        {showPalette && (
          <div 
            className="md:hidden fixed inset-0 bg-black/35 z-20 backdrop-blur-sm" 
            onClick={() => setShowPalette(false)} 
          />
        )}
        <div className={`
          fixed md:static top-[56px] bottom-0 md:top-auto md:bottom-auto left-0 z-30 w-56 bg-[#0f172a] border-r border-white/[0.07] flex flex-col overflow-y-auto transition-transform duration-200
          ${showPalette ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-4 pb-2">Add Nodes</p>
          <div className="px-2 pb-4 space-y-3">
            {PALETTE.map(group => (
              <div key={group.group}>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 py-1">{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <button
                      key={item.type}
                      onClick={() => {
                        addNode(item.type);
                        if (window.innerWidth < 768) setShowPalette(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: item.color + '22' }}>
                        <item.icon size={15} style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0b1120]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            defaultEdgeOptions={{ type: 'button' }}
            fitView
            deleteKeyCode="Delete"
            snapToGrid
            snapGrid={[15, 15]}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#1e2a44" />
            <Controls position="top-left" />
            <MiniMap
              className="!bg-[#0f172a] !border !border-white/10 !rounded-lg"
              maskColor="rgba(11,17,32,0.7)"
              nodeColor={n => {
                if (n.type === 'start')     return '#22c55e';
                if (n.type === 'message')   return '#3b82f6';
                if (n.type === 'condition') return '#a855f7';
                if (n.type === 'send_media') return '#ec4899';
                if (n.type === 'list_message') return '#14b8a6';
                if (n.type === 'end')       return '#ef4444';
                return '#64748b';
              }}
            />
          </ReactFlow>
        </div>

        {/* Floating Toggle Button for Add Nodes sidebar (Mobile view only) */}
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="md:hidden absolute bottom-5 left-5 z-20 w-11 h-11 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          title="Add Node"
        >
          {showPalette ? <X size={20} /> : <Plus size={20} />}
        </button>

        {/* Right Panel — node settings (Sliding panel on mobile, standard sidebar on desktop) */}
        {selected && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="md:hidden fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" 
              onClick={() => setSelected(null)} 
            />
            <div className="fixed md:static top-[56px] bottom-0 md:top-auto md:bottom-auto right-0 z-30 w-[320px] max-w-[85vw] md:w-72 bg-[#0f172a] border-l border-white/[0.07] flex flex-col shadow-2xl md:shadow-none overflow-hidden transition-transform duration-200 animate-slide-in-right">
              <NodePanel
                node={nodes.find(n => n.id === selected.id) || selected}
                onUpdate={(data) => updateNodeData(selected.id, data)}
                onDelete={() => deleteNode(selected.id)}
                onClose={() => setSelected(null)}
                triggerKeywords={keywords}
                onTriggerKeywordsChange={setKeywords}
              />
            </div>
          </>
        )}
      </div>

      {/* Triggers Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Trigger Keywords</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Flow starts when user sends any of these keywords
            </p>
            <div className="flex gap-2 mb-3">
              <input
                value={kwInput}
                onChange={e => setKwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="Type keyword and press Enter"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button onClick={addKeyword}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] bg-gray-50 rounded-xl p-3">
              {keywords.length === 0 && <span className="text-xs text-gray-400">No keywords yet</span>}
              {keywords.map((kw, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {kw}
                  <button onClick={() => setKeywords(k => k.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <button onClick={() => { save(); setShowSettings(false); }}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold">
              Save & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
