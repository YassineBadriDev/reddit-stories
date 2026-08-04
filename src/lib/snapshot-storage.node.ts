import storage from "@storage-backend";

const file = (name: string): string => `snapshots/${name}.json`;

const backend = {
  async read(name: string): Promise<string | undefined> {
    return storage.read(file(name));
  },
  async write(name: string, content: string): Promise<void> {
    return storage.write(file(name), content);
  },
  async remove(name: string): Promise<void> {
    return storage.remove(file(name));
  },
};

export default backend;
