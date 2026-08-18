export interface DatedResponse {
  id: string;
  created_at: string;
}

export interface ResponseDateGroup<T extends DatedResponse> {
  label: string;
  responses: T[];
}

function parseResponseDate(value: string) {
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR');
}

export function groupResponsesByDate<T extends DatedResponse>(responses: T[], now = new Date()): ResponseDateGroup<T>[] {
  const todayKey = localDateKey(now);
  const groups = new Map<string, T[]>();

  [...responses]
    .sort((a, b) => parseResponseDate(b.created_at).getTime() - parseResponseDate(a.created_at).getTime())
    .forEach((response) => {
      const date = parseResponseDate(response.created_at);
      const key = localDateKey(date);
      groups.set(key, [...(groups.get(key) || []), response]);
    });

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, groupedResponses]) => {
      const [year, month, day] = key.split('-').map(Number);
      const date = new Date(year, month, day);
      return { label: key === todayKey ? 'Hoje' : formatDate(date), responses: groupedResponses };
    });
}
