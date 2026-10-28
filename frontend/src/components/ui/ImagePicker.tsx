import { useRef, useState } from 'react';
import api from '../../lib/api';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ImagePickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/**
 * Thumbnail picker used by the post, linkup, rent and forum composers.
 * Files upload immediately on select; only the resulting URLs are submitted
 * with the form, so composers keep posting JSON.
 */
export function ImagePicker({ value, onChange, max = 5 }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const room = max - value.length;
    if (room <= 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.slice(0, room).forEach(file => formData.append('images', file));
      const res = await api.post('/uploads', formData, {
        // The shared client defaults to JSON; multipart needs its own boundary
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange([...value, ...(res.data.urls || [])]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      {(value.length > 0 || uploading) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-navy-100/30">
              <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove image"
                className="absolute top-1 right-1 p-1 bg-navy-900/70 text-cream-50 rounded-full hover:bg-navy-900 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="w-20 h-20 rounded-xl border border-navy-100/30 bg-cream-100 flex items-center justify-center">
              <Loader2 size={18} className="text-navy-400 animate-spin" />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || value.length >= max}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-navy-100/30 text-sm font-medium text-navy-500 hover:bg-navy-50 hover:border-navy-200 transition-all btn-press disabled:opacity-50"
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
        {uploading ? 'Uploading…' : value.length >= max ? `Max ${max} images` : 'Photo'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
