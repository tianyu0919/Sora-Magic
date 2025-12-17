import Dexie, { type EntityTable } from 'dexie';

interface Setting {
  id?: number;
  key: string;
  value: any;
}

interface Task {
  id?: number;
  prompt: string;
  model: string;
  type: 'image' | 'video';
  status: 'pending' | 'success' | 'failed';
  result?: string; // URL or error message
  createdAt: Date;
}

const db = new Dexie('GouziDB') as Dexie & {
  settings: EntityTable<Setting, 'id'>;
  tasks: EntityTable<Task, 'id'>;
};

// Schema declaration:
db.version(2).stores({
  settings: '++id, key',
  tasks: '++id, createdAt, status'
});

export type { Setting, Task };
export { db };