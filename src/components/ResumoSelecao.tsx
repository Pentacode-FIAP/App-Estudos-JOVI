import type { Resumo } from '../types';

export function ResumoSelecao({ resumos, selecionados, onChange }: {
  resumos: Resumo[]; selecionados: number[]; onChange: (ids: number[]) => void;
}) {
  return <fieldset className="form-sem-borda">
    <legend className="campo-label">O que vai cair na prova?</legend>
    <div className="lista selecao-resumos">{resumos.map(r => <label key={r.id} className="card selecao-resumo">
      <input type="checkbox" checked={selecionados.includes(r.id!)} onChange={() => onChange(selecionados.includes(r.id!) ? selecionados.filter(id => id !== r.id) : [...selecionados, r.id!])} />
      <span>{r.titulo}</span>
    </label>)}</div>
    {resumos.length === 0 && <p className="campo-ajuda">Crie um resumo dessa matéria para incluir no plano.</p>}
  </fieldset>;
}
