export type StoredObject = { key: string; contentType: string; bytes: Uint8Array };

export class MemoryStorage {
  private readonly objects = new Map<string, StoredObject>();

  put(object: StoredObject) {
    this.objects.set(object.key, object);
    return object;
  }

  get(key: string): StoredObject | undefined {
    return this.objects.get(key);
  }
}
