import { useMemo, useState } from 'react'
import type { ClauseType, ContractClause } from '../types/clause'

export function useClauseSearch(clauses: ContractClause[]) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ClauseType | 'all'>('all')
  const types = useMemo(() => [...new Set(clauses.map((clause) => clause.type))].toSorted(), [clauses])
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return clauses.filter((clause) => (type === 'all' || clause.type === type) && (!needle || `${clause.title}\n${clause.text}`.toLocaleLowerCase().includes(needle)))
  }, [clauses, query, type])
  return { query, setQuery, type, setType, types, results }
}
