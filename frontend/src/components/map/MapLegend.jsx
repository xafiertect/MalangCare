export function MapLegend() {
  const items = [
    { color: '#22c55e', label: 'Ringan' },
    { color: '#eab308', label: 'Sedang' },
    { color: '#ef4444', label: 'Berat' },
    { color: '#6b7280', label: 'Selesai' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">Tingkat Kerusakan</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
