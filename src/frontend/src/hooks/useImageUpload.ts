import { loadConfig } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";

export interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Uploads a product image to the platform object storage and resolves to a
 * direct URL that can be persisted in the product `images` field.
 *
 * The backend stores product images as `[Text]`, so we upload the binary to
 * the storage gateway and keep the resulting proxy URL as the image reference.
 */
export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setState({ isUploading: true, progress: 0, error: null });
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => undefined);
      }
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(
        bytes,
        (percentage) => setState((s) => ({ ...s, progress: percentage })),
        file.type,
        file.name,
      );
      const url = await client.getDirectURL(hash);
      setState({ isUploading: false, progress: 100, error: null });
      return url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить файл";
      setState({ isUploading: false, progress: 0, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return { ...state, upload, reset };
}
