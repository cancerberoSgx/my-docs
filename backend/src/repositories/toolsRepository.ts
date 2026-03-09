import { db } from '../db';

export interface Tool {
  id: number;
  name: string;
  description: string;
}

export interface ToolWithTypes extends Tool {
  documentTypes: string[];
}

async function attachTypes(tools: Tool[]): Promise<ToolWithTypes[]> {
  if (tools.length === 0) return [];
  const ids = tools.map((t) => t.id);
  const { rows } = await db.query<{ tool_id: number; document_type: string }>(
    `SELECT tool_id, document_type FROM tool_document_types WHERE tool_id = ANY($1)`,
    [ids],
  );
  const typeMap = new Map<number, string[]>();
  for (const row of rows) {
    if (!typeMap.has(row.tool_id)) typeMap.set(row.tool_id, []);
    typeMap.get(row.tool_id)!.push(row.document_type);
  }
  return tools.map((t) => ({ ...t, documentTypes: typeMap.get(t.id) ?? [] }));
}

export async function getAllTools(): Promise<ToolWithTypes[]> {
  const { rows } = await db.query<Tool>('SELECT id, name, description FROM tools ORDER BY id');
  return attachTypes(rows);
}

export async function getToolById(id: number): Promise<ToolWithTypes | null> {
  const { rows } = await db.query<Tool>('SELECT id, name, description FROM tools WHERE id = $1', [id]);
  if (!rows[0]) return null;
  return (await attachTypes(rows))[0];
}

export async function getToolsByDocumentType(documentType: string): Promise<Tool[]> {
  const { rows } = await db.query<Tool>(
    `SELECT t.id, t.name, t.description
     FROM tools t
     JOIN tool_document_types tdt ON tdt.tool_id = t.id
     WHERE tdt.document_type = $1
     ORDER BY t.id`,
    [documentType],
  );
  return rows;
}
