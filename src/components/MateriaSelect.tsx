import { useEffect, useId, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Sheet } from './Sheet';
import { MateriasScreen } from '../features/materias/MateriasScreen';

export function MateriaSelect({
  value,
  onChange,
  permitirVazio = true,
}: {
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  permitirVazio?: boolean;
}) {
  const materias = useLiveQuery(() => db.materias.toArray(), []) ?? [];
  const [gerenciando, setGerenciando] = useState(false);
  // Pode haver mais de um MateriaSelect montado (um por sheet aberto).
  const selectId = useId();

  // Quando "Sem matéria" não é uma opção válida, o <select> exibe a primeira
  // matéria visualmente assim que a lista carrega, mesmo que `value` ainda
  // esteja undefined — sem isso o estado do formulário ficaria dessincronizado
  // do que é mostrado na tela (o resumo seria salvo sem matéria de verdade).
  useEffect(() => {
    if (!permitirVazio && value === undefined && materias.length > 0) {
      onChange(materias[0].id);
    }
  }, [permitirVazio, value, materias, onChange]);

  return (
    <>
      <div className="campo">
        <div className="materia-field-row">
          <label className="campo-label" htmlFor={selectId}>
            Matéria
          </label>
          <button className="link-materias" type="button" onClick={() => setGerenciando(true)}>
            {materias.length === 0 ? 'Criar matéria' : 'Gerenciar'}
          </button>
        </div>
        <select
          id={selectId}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          {permitirVazio && <option value="">Sem matéria</option>}
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>
      {gerenciando && (
        <Sheet titulo="Matérias" onFechar={() => setGerenciando(false)}>
          <MateriasScreen />
        </Sheet>
      )}
    </>
  );
}
