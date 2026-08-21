import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assetLabel,
  isStoredAsset,
  resolveDeviceAsset,
  uploadDeviceAsset,
} from "@/lib/device-assets";

interface Props {
  id: string;
  label: string;
  placeholder?: string;
  /** "images" for photos, "files" for autorun / firmware payloads. */
  kind: "images" | "files";
  accept?: string;
  value: string;
  onChange: (value: string) => void;
  /** Non-admins get a read-only view (no uploads, no editing). */
  canUpload: boolean;
}

export function DeviceAssetField({
  id,
  label,
  placeholder,
  kind,
  accept,
  value,
  onChange,
  canUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ref = await uploadDeviceAsset(file, kind);
      onChange(ref);
      toast.success(`${file.name} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={isStoredAsset(value) ? assetLabel(value) : value}
          placeholder={placeholder}
          readOnly={isStoredAsset(value) || !canUpload}
          onChange={(e) => onChange(e.target.value)}
        />
        {isStoredAsset(value) && canUpload && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Remove uploaded ${label}`}
            onClick={() => onChange("")}
          >
            <X className="size-4" />
          </Button>
        )}
        {canUpload && (
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Upload className="mr-1 size-4" />
            )}
            Upload
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {kind === "images" && <AssetPreview value={value} />}
    </div>
  );
}

function AssetPreview({ value }: { value: string }) {
  const url = useResolvedAsset(value);
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      className="mt-1 h-20 w-auto rounded-md border border-border object-contain"
    />
  );
}

/** Resolves a device asset reference to a usable (signed, if uploaded) URL. */
export function useResolvedAsset(value: string | null | undefined, download = false) {
  const [url, setUrl] = useState<string | null>(
    value && !isStoredAsset(value) ? value : null,
  );

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setUrl(null);
      return;
    }
    if (!isStoredAsset(value)) {
      setUrl(value);
      return;
    }
    resolveDeviceAsset(value, { download }).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [value, download]);

  return url;
}
