import { assertProductionRuntimeSafety } from "@ctw/config";

export type StoredObject = { key: string; contentType: string; bytes: Uint8Array };
export type PutObjectInput = StoredObject;

export type ObjectStorage = {
  put: (object: PutObjectInput) => Promise<StoredObject>;
  get: (key: string) => Promise<StoredObject | undefined>;
};

export class MemoryStorage implements ObjectStorage {
  private readonly objects = new Map<string, StoredObject>();

  async put(object: PutObjectInput) {
    this.objects.set(object.key, object);
    return object;
  }

  async get(key: string): Promise<StoredObject | undefined> {
    return this.objects.get(key);
  }
}

export class S3CompatibleStorage implements ObjectStorage {
  constructor(
    private readonly endpoint: string,
    private readonly bucket: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async put(object: PutObjectInput) {
    const body = new ArrayBuffer(object.bytes.byteLength);
    new Uint8Array(body).set(object.bytes);
    const response = await this.fetchImpl(`${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${encodeURIComponent(object.key)}`, {
      method: "PUT",
      headers: { "content-type": object.contentType },
      body
    });
    if (!response.ok) throw new Error(`S3-compatible storage put failed: ${response.status}`);
    return object;
  }

  async get(): Promise<StoredObject | undefined> {
    throw new Error("S3-compatible storage reads are intentionally not exposed through the app API");
  }
}

export function createStorage(source: NodeJS.ProcessEnv = process.env): ObjectStorage {
  const runtimeEnv = assertProductionRuntimeSafety(source);
  if (runtimeEnv.CTW_STORAGE_MODE === "s3") {
    return new S3CompatibleStorage(required(source.STORAGE_ENDPOINT, "STORAGE_ENDPOINT"), required(source.STORAGE_BUCKET, "STORAGE_BUCKET"));
  }
  return memoryStorage;
}

const memoryStorage = new MemoryStorage();

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required for S3 storage mode`);
  return value;
}
