import { db } from '../db';

export interface Tool {
  id: number;
  name: string;
  description: string;
}

export interface Action {
  id: number;
  name: string;
  description: string;
  params_schema: Record<string, unknown> | null;
}

export interface ToolFull extends Tool {
  documentTypes: string[];
  actions: Action[];
}

async function attachMeta(tools: Tool[]): Promise<ToolFull[]> {
  if (tools.length === 0) return [];
  const ids = tools.map((t) => t.id);

  const { rows: typeRows } = await db.query<{ tool_id: number; document_type: string }>(
    `SELECT tool_id, document_type FROM tool_document_types WHERE tool_id = ANY($1)`,
    [ids],
  );
  const { rows: actionRows } = await db.query<Action & { tool_id: number }>(
    `SELECT ta.tool_id, a.id, a.name, a.description, a.params_schema
     FROM tool_actions ta JOIN actions a ON a.id = ta.action_id
     WHERE ta.tool_id = ANY($1)
     ORDER BY a.id`,
    [ids],
  );

  const typeMap = new Map<number, string[]>();
  for (const row of typeRows) {
    if (!typeMap.has(row.tool_id)) typeMap.set(row.tool_id, []);
    typeMap.get(row.tool_id)!.push(row.document_type);
  }
  const actionMap = new Map<number, Action[]>();
  for (const row of actionRows) {
    if (!actionMap.has(row.tool_id)) actionMap.set(row.tool_id, []);
    const { tool_id: _, ...action } = row;
    actionMap.get(row.tool_id)!.push(action);
  }

  return tools.map((t) => ({
    ...t,
    documentTypes: typeMap.get(t.id) ?? [],
    actions: actionMap.get(t.id) ?? [],
  }));
}

export async function getAllTools(): Promise<ToolFull[]> {
  const { rows } = await db.query<Tool>('SELECT id, name, description FROM tools ORDER BY id');
  return attachMeta(rows);
}

export async function getToolById(id: number): Promise<ToolFull | null> {
  const { rows } = await db.query<Tool>('SELECT id, name, description FROM tools WHERE id = $1', [id]);
  if (!rows[0]) return null;
  return (await attachMeta(rows))[0];
}

export async function getToolsByDocumentType(documentType: string): Promise<ToolFull[]> {
  const { rows } = await db.query<Tool>(
    `SELECT t.id, t.name, t.description
     FROM tools t
     JOIN tool_document_types tdt ON tdt.tool_id = t.id
     WHERE tdt.document_type = $1
     ORDER BY t.id`,
    [documentType],
  );
  return attachMeta(rows);
}
