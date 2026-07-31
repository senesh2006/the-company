export default function SharedMemory() {
  return (
    <div className="h-full flex flex-col relative space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Shared Memory Explorer</h2>
        <div className="text-sm font-mono text-zinc-500">GLOBAL SWARM STATE</div>
      </div>
      
      <div className="flex-1 glass-panel border border-zinc-800 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-400 font-mono">Memory module booting...</p>
          <p className="text-xs text-zinc-600 font-mono">Syncing with Supabase Redis cache.</p>
        </div>
      </div>
    </div>
  );
}
