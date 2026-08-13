"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react";

type GalleryImage = {
  _id: string;
  url: string;
  publicId?: string;
  caption?: string;
  createdAt: string;
};

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(data.images ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const uploadOne = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "gallery");
    const uploadRes = await fetch("/api/upload", { method: "POST", body });
    const uploaded = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploaded.error || "Upload failed");

    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploaded.url, publicId: uploaded.publicId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.image as GalleryImage;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map(uploadOne));
      setImages((prev) => [...uploaded, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateCaption = async (id: string, caption: string) => {
    setImages((prev) => prev.map((img) => (img._id === id ? { ...img, caption } : img)));
    try {
      await fetch(`/api/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setImages((prev) => prev.filter((img) => img._id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-foreground">Gallery</h1>
          <p className="text-muted-foreground">
            Photos shown in the club website&apos;s Gallery section — no news post required.
          </p>
        </div>
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <div className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90">
            {uploading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Upload size={18} aria-hidden />}
            {uploading ? "Uploading…" : "Upload Photos"}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
          <ImageIcon size={40} className="text-muted-foreground opacity-50" aria-hidden />
          <p className="text-muted-foreground">No gallery photos yet — upload some to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div key={img._id} className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={img.url} alt={img.caption || ""} fill className="object-cover" />
                <button
                  onClick={() => remove(img._id)}
                  aria-label="Delete photo"
                  className="absolute top-2 right-2 cursor-pointer rounded-lg bg-black/60 p-1.5 text-white transition-colors duration-200 hover:bg-destructive"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
              <input
                type="text"
                placeholder="Caption (optional)"
                defaultValue={img.caption}
                onBlur={(e) => updateCaption(img._id, e.target.value)}
                className="w-full border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
