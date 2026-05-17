import { assertProductionRuntimeSafety } from "@ctw/config";
import { createHash, createHmac } from "node:crypto";

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
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly region = "us-east-1",
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async put(object: PutObjectInput) {
    const body = new ArrayBuffer(object.bytes.byteLength);
    new Uint8Array(body).set(object.bytes);
    const url = `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${encodeS3Key(object.key)}`;
    const headers = signedPutHeaders({
      accessKeyId: this.accessKeyId,
      body: object.bytes,
      contentType: object.contentType,
      region: this.region,
      secretAccessKey: this.secretAccessKey,
      url
    });
    const response = await this.fetchImpl(url, {
      method: "PUT",
      headers,
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
    return new S3CompatibleStorage(
      required(source.STORAGE_ENDPOINT, "STORAGE_ENDPOINT"),
      required(source.STORAGE_BUCKET, "STORAGE_BUCKET"),
      required(source.STORAGE_ACCESS_KEY_ID, "STORAGE_ACCESS_KEY_ID"),
      required(source.STORAGE_SECRET_ACCESS_KEY, "STORAGE_SECRET_ACCESS_KEY"),
      source.STORAGE_REGION ?? "us-east-1"
    );
  }
  return memoryStorage;
}

const memoryStorage = new MemoryStorage();

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required for S3 storage mode`);
  return value;
}

function signedPutHeaders({
  accessKeyId,
  body,
  contentType,
  region,
  secretAccessKey,
  url
}: {
  accessKeyId: string;
  body: Uint8Array;
  contentType: string;
  region: string;
  secretAccessKey: string;
  url: string;
}) {
  const parsed = new URL(url);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${parsed.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n") + "\n";
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", parsed.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(signingKey(secretAccessKey, dateStamp, region), stringToSign);

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "content-type": contentType,
    host: parsed.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
}

function encodeS3Key(key: string) {
  return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function toAmzDate(value: Date) {
  return value.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, "s3");
  return hmac(dateRegionServiceKey, "aws4_request");
}
