"use client";

import { useState, useRef } from "react";
import { 
  useMemory, 
  useKnowledgeDocuments, 
  useUploadDocument, 
  useDeleteDocument,
  useSetMemory 
} from "@/lib/queries";
import { KnowledgeDocument, KnowledgeCategory } from "@/lib/api";
import { 
  Database, 
  Search, 
  Cpu, 
  Key, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Sparkles, 
  Palette, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Trash2, 
  Eye, 
  X, 
  Plus
} from "lucide-react";

const CATEGORIES: { label: KnowledgeCategory; icon: any; color: string; desc: string }[] = [
  { 
    label: "Brand Guidelines", 
    icon: Palette, 
    color: "from-pink-50 to-rose-50 border-pink-200 text-pink-700",
    desc: "Color palettes, typography, tone of voice & visual identity"
  },
  { 
    label: "Financial Reports", 
    icon: TrendingUp, 
    color: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700",
    desc: "P&L statements, revenue models, expense budgets & runway"
  },
  { 
    label: "Product Documentation", 
    icon: BookOpen, 
    color: "from-blue-50 to-cyan-50 border-blue-200 text-blue-700",
    desc: "System specs, architecture designs, API docs & roadmaps"
  },
  { 
    label: "Customer Personas", 
    icon: Users, 
    color: "from-amber-50 to-orange-50 border-amber-200 text-amber-700",
    desc: "ICP profiles, customer pain points, objections & user journeys"
  },
  { 
    label: "General Knowledge", 
    icon: Database, 
    color: "from-violet-50 to-purple-50 border-violet-200 text-violet-700",
    desc: "Internal operating procedures & company standards"
  }
];

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<"knowledge" | "matrix">("knowledge");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals & Inspection State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddKVOpen, setIsAddKVOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<KnowledgeCategory>("Brand Guidelines");
  const [uploadTitle, setUploadTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add KV Form State
  const [kvKey, setKvKey] = useState("");
  const [kvValue, setKvValue] = useState("");
  const [kvTags, setKvTags] = useState("");

  // Queries & Mutations
  const { data: memoryEntries, isLoading: isMemoryLoading } = useMemory();
  const { data: documents, isLoading: isDocsLoading } = useKnowledgeDocuments(selectedCategory);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const setMemoryMutation = useSetMemory();

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      setIsUploadOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      await uploadMutation.mutateAsync({
        file: uploadFile,
        category: uploadCategory,
        title: uploadTitle.trim() || uploadFile.name,
      });
      // Reset form
      setUploadFile(null);
      setUploadTitle("");
      setIsUploadOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvKey || !kvValue) return;

    const tagsList = kvTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    let parsedVal = kvValue;
    try {
      parsedVal = JSON.parse(kvValue);
    } catch {
      // keep as string
    }

    try {
      await setMemoryMutation.mutateAsync({
        key: kvKey,
        value: parsedVal,
        tags: tagsList,
      });
      setKvKey("");
      setKvValue("");
      setKvTags("");
      setIsAddKVOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = documents?.filter((doc) => {
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredMemory = memoryEntries?.filter((entry) => 
    entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(entry.value).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.updatedBy || entry.updated_by || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-600" />;
      case "csv":
      case "tsv":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case "md":
      case "markdown":
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case "json":
        return <FileCode className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-teal-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-700/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                Shared Knowledge Vault
              </span>
              <span className="text-xs text-emerald-100 font-mono">Cross-Worker Grounding Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-200" />
              Company Knowledge & Memory
            </h1>
            <p className="text-sm text-emerald-50 leading-relaxed">
              Ingest brand guidelines, financial spreadsheets, product architectures, and customer personas. 
              All AI Workers automatically synthesize this grounding context to make authoritative decisions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              Upload Document
            </button>
            <button
              onClick={() => setIsAddKVOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs border border-white/20 flex items-center gap-2 transition-all hover:scale-[1.02] backdrop-blur-md"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              Add Key-Value
            </button>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-emerald-600/40">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = documents?.filter((d) => d.category === cat.label).length || 0;
            return (
              <div 
                key={cat.label}
                onClick={() => {
                  setSelectedCategory(cat.label === selectedCategory ? "all" : cat.label);
                  setActiveTab("knowledge");
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  selectedCategory === cat.label 
                    ? "bg-white text-slate-900 border-white shadow-lg scale-[1.02]" 
                    : "bg-white/10 border-white/15 text-white hover:bg-white/20 backdrop-blur-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg border bg-gradient-to-br ${cat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`font-mono text-[11px] font-bold ${selectedCategory === cat.label ? 'text-emerald-700' : 'text-emerald-100'}`}>
                    {count} {count === 1 ? "doc" : "docs"}
                  </span>
                </div>
                <div>
                  <h4 className={`text-xs font-bold truncate ${selectedCategory === cat.label ? 'text-slate-900' : 'text-white'}`}>{cat.label}</h4>
                  <p className={`text-[10px] line-clamp-1 ${selectedCategory === cat.label ? 'text-slate-500' : 'text-emerald-100/80'}`}>{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Main View Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs w-fit">
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "knowledge"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Documents ({documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "matrix"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Memory Matrix ({memoryEntries?.length || 0})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === "knowledge" 
                ? "Search documents by title, category, keywords..." 
                : "Search memory keys, structured JSON values..."
            }
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
          />
        </div>
      </div>

      {/* TAB CONTENT: KNOWLEDGE DOCUMENTS */}
      {activeTab === "knowledge" && (
        <div className="flex flex-col gap-6">
          {/* Quick Dropzone Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer ${
              dragActive 
                ? "border-emerald-500 bg-emerald-50 scale-[1.01]" 
                : "border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 shadow-xs"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.csv,.tsv,.md,.markdown,.txt,.doc,.docx,.json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Drop files here to index into Collective Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, Notion markdown exports, Google Docs / TXT, CSV spreadsheets, and JSON configs
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">.PDF</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">.CSV / TSV</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">.MD / Notion</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">.TXT / JSON</span>
            </div>
          </div>

          {/* Loading or Empty State */}
          {isDocsLoading ? (
            <div className="p-12 flex items-center justify-center min-h-[250px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-slate-500">Loading ingested knowledge documents...</p>
              </div>
            </div>
          ) : !filteredDocs || filteredDocs.length === 0 ? (
            <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-300 bg-white">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Documents in {selectedCategory === 'all' ? 'Knowledge Base' : selectedCategory}</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Upload your brand style guide, Q2 financial reports, system architecture docs, or ICP customer profiles to ground your AI workforce.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocs.map((doc) => {
                return (
                  <div
                    key={doc.id}
                    className="bento-card p-5 flex flex-col justify-between gap-4 group hover:border-emerald-500/50 bg-white border border-slate-200 transition-all shadow-xs hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                            {getFileIcon(doc.file_type)}
                          </div>
                          <div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {doc.category}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                              {doc.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Summary Box */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-28 overflow-y-auto no-scrollbar">
                        <p className="font-sans text-[11px] text-slate-700">
                          {doc.summary || doc.content.slice(0, 160) + "..."}
                        </p>
                      </div>

                      {/* Metadata badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-600">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                          {formatBytes(doc.file_size_bytes)}
                        </span>
                        {doc.metadata?.pages && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                            📄 {doc.metadata.pages} {doc.metadata.pages === 1 ? 'page' : 'pages'}
                          </span>
                        )}
                        {doc.metadata?.row_count !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                            📊 {doc.metadata.row_count} rows
                          </span>
                        )}
                        {doc.metadata?.header_count && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                            🔖 {doc.metadata.header_count} sections
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {doc.filename}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInspectingDoc(doc)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-medium flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${doc.title}" from knowledge base?`)) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SHARED MEMORY MATRIX (KEY-VALUE) */}
      {activeTab === "matrix" && (
        <div className="flex flex-col gap-6">
          {isMemoryLoading ? (
            <div className="p-12 flex items-center justify-center min-h-[250px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-slate-500">Loading collective memory matrix...</p>
              </div>
            </div>
          ) : !filteredMemory || filteredMemory.length === 0 ? (
            <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-300 bg-white">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Memory Entries Found</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Add global configuration keys or let AI Workers write learned operational parameters during tasks.
              </p>
              <button
                onClick={() => setIsAddKVOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Key-Value Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMemory.map((entry) => (
                <div key={entry.id} className="bento-card p-5 flex flex-col justify-between gap-4 bg-white border border-slate-200 shadow-xs">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Key className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-mono text-xs font-bold text-emerald-800 truncate uppercase tracking-wider">
                          {entry.key}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {entry.timestamp || entry.created_at ? new Date(entry.timestamp || entry.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 max-h-48 overflow-y-auto no-scrollbar">
                      <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {typeof entry.value === 'object' ? JSON.stringify(entry.value, null, 2) : String(entry.value)}
                      </pre>
                    </div>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      <span>Synced by {entry.updatedBy || entry.updated_by || 'Core Orchestrator'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload Company Document</h3>
                  <p className="text-xs text-slate-500">Process & sync into Collective Shared Memory</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              {/* File selection box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Document File</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    accept=".pdf,.csv,.tsv,.md,.markdown,.txt,.doc,.docx,.json"
                    className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Brand Identity & Tone Guidelines"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Domain Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as KnowledgeCategory)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label} ({c.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Index
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD KEY-VALUE MODAL */}
      {isAddKVOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Shared Memory Key</h3>
                  <p className="text-xs text-slate-500">Low-level runtime state for AI Workers</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddKVOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKVSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Memory Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. max_customer_acquisition_cost"
                  value={kvKey}
                  onChange={(e) => setKvKey(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Value (String or JSON)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter text or JSON string..."
                  value={kvValue}
                  onChange={(e) => setKvValue(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="finance, budget, q3"
                  value={kvTags}
                  onChange={(e) => setKvTags(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddKVOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setMemoryMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  {setMemoryMutation.isPending ? "Saving..." : "Save Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT INSPECTOR DRAWER / MODAL */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 md:p-8">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  {getFileIcon(inspectingDoc.file_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {inspectingDoc.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {inspectingDoc.filename} ({formatBytes(inspectingDoc.file_size_bytes)})
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {inspectingDoc.title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Summary Callout */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  AI Processed Document Summary
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {inspectingDoc.summary}
                </p>
              </div>

              {/* Extracted Content Viewer */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                    Extracted Text & Ingested Tables
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {inspectingDoc.metadata?.word_count || inspectingDoc.content.split(' ').length} words
                  </span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 font-mono text-xs text-slate-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto shadow-inner">
                  {inspectingDoc.content}
                </div>
              </div>

              {/* Metadata details */}
              {inspectingDoc.metadata && Object.keys(inspectingDoc.metadata).length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 font-mono uppercase tracking-wider">
                    Extracted Metadata Schema
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    {Object.entries(inspectingDoc.metadata).map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 uppercase">{k}</span>
                        <span className="text-slate-800 font-medium truncate">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Indexed in Shared Memory ID: {inspectingDoc.id}
              </span>
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
