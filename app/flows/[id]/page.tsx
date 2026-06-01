'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Connection, Edge, Node, NodeTypes, ReactFlowInstance,
  MarkerType, Panel,
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
import NodePanel        from './NodePanel';

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
      setEdges(savedEdges);
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
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#25D366' },
      style: { stroke: '#25D366', strokeWidth: 2 },
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
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-whatsapp-green border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-50">

      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <button onClick={() => router.push('/flows')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 truncate">{flow?.name || 'Flow Builder'}</h1>
          <p className="text-xs text-gray-400">
            {nodes.length} nodes · {edges.length} connections
          </p>
        </div>

        {/* Keywords button */}
        <button onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">
          <Zap size={14} className="text-yellow-500" />
          Triggers ({keywords.length})
        </button>

        {/* Active toggle */}
        <button onClick={toggleActive}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
            flow?.is_active
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}>
          {flow?.is_active
            ? <ToggleRight size={18} className="text-green-600" />
            : <ToggleLeft  size={18} />}
          {flow?.is_active ? 'Active' : 'Inactive'}
        </button>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-whatsapp-green hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Palette */}
        <div className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">Add Nodes</p>
          <div className="px-2 pb-4 space-y-3">
            {PALETTE.map(group => (
              <div key={group.group}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <button key={item.type} onClick={() => addNode(item.type)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: item.color + '18' }}>
                        <item.icon size={15} style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                        <p className="text-[10px] text-gray-400">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
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
            fitView
            deleteKeyCode="Delete"
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls />
            <MiniMap nodeColor={n => {
              if (n.type === 'start')     return '#25D366';
              if (n.type === 'message')   return '#3B82F6';
              if (n.type === 'condition') return '#8B5CF6';
              if (n.type === 'end')       return '#EF4444';
              return '#9CA3AF';
            }} />
          </ReactFlow>
        </div>

        {/* Right Panel — node settings */}
        {selected && (
          <NodePanel
            node={selected}
            onUpdate={(data) => updateNodeData(selected.id, data)}
            onDelete={() => deleteNode(selected.id)}
            onClose={() => setSelected(null)}
          />
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              />
              <button onClick={addKeyword}
                className="bg-whatsapp-green text-white px-3 py-2 rounded-lg text-sm">
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
              className="w-full mt-4 bg-whatsapp-green text-white py-2.5 rounded-xl text-sm font-semibold">
              Save & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
