export default function SharedMemory() {
  return (
    <div className="h-full flex flex-col relative space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Shared Memory Explorer</h2>
        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Global Swarm State</div>
      </div>
      
      <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-gray-500 font-medium">Memory module booting...</p>
          <p className="text-xs text-gray-400 font-medium">Syncing with Supabase Redis cache.</p>
        </div>
      </div>
    </div>
  );
}
