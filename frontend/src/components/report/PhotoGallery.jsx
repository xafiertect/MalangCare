import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function PhotoGallery({ photos = [], title = 'Foto' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!photos.length) return null;

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  const next = () => setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title} ({photos.length})</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, idx) => (
          <button
            key={photo.id || idx}
            onClick={() => openLightbox(idx)}
            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
          >
            <img
              src={photo.photo_url}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X size={28} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 text-white hover:text-gray-300 p-2"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 text-white hover:text-gray-300 p-2"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <img
            src={photos[lightboxIndex].photo_url}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-w-4xl max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-4 text-white text-sm opacity-70">
            {lightboxIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
