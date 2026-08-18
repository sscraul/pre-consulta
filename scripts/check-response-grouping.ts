import assert from 'node:assert/strict';
import { groupResponsesByDate } from '../src/client/utils/responseGrouping';

const groups = groupResponsesByDate(
  [
    { id: 'old', created_at: '2026-08-16 23:00:00' },
    { id: 'today-late', created_at: '2026-08-17 14:00:00' },
    { id: 'today-early', created_at: '2026-08-17 09:00:00' },
  ],
  new Date('2026-08-17T15:00:00-03:00'),
);

assert.deepEqual(groups.map((group) => group.label), ['Hoje', '16/08/2026']);
assert.deepEqual(groups[0].responses.map((response) => response.id), ['today-late', 'today-early']);
assert.deepEqual(groups[1].responses.map((response) => response.id), ['old']);

console.log('Ordenação e agrupamento de fichas: OK');
