import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Sparkles } from 'lucide-react';
import { db } from '../../lib/db';
import { gerarResumo, gerarResumoTexto } from '../../lib/gemini';
import { Sheet } from '../../components/Sheet';
import { MateriaSelect } from '../../components/MateriaSelect';
import { Segmented } from '../../components/Segmented';
import { FotoThumb } from '../../components/FotoThumb';

export function NovoResumoSheet({ onFechar, fotoInicialId }: { onFechar: () => void; fotoInicialId?: number }) {
  const fotos = useLiveQuery(() => db.fotos.orderBy('dataUpload').reverse().toArray(), []) ?? [];
  const materias = useLiveQuery(() => db.materias.toArray(), []) ?? [];
  const [origem, setOrigem] = useState<'fotos' | 'texto'>('fotos');
  const [fotoIds, setFotoIds] = useState<number[]>(fotoInicialId ? [fotoInicialId] : []);
  const [titulo, setTitulo] = useState('');
  const [materiaId, setMateriaId] = useState<number>();
  const [texto, setTexto] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [revisando, setRevisando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const temFonte = origem === 'texto' ? !!texto.trim() : fotoIds.length > 0;

  async function gerar() {
    if (!temFonte || ocupado) return;
    setOcupado(true); setErro('');
    try {
      const materia = materias.find(m => m.id === materiaId)?.nome ?? 'Estudos';
      const resultado = origem === 'texto'
        ? await gerarResumoTexto(texto, materia)
        : await gerarResumo(fotos.filter(f => fotoIds.includes(f.id!)).map(f => f.blob), materia);
      setConteudo(resultado); setRevisando(true);
    } catch { setErro('Não foi possível gerar. Tente novamente ou use a opção Colar texto.'); }
    finally { setOcupado(false); }
  }

  async function salvar() {
    if (!titulo.trim() || !conteudo.trim() || ocupado) return;
    setOcupado(true); setErro('');
    try {
      await db.resumos.add({ titulo: titulo.trim(), materiaId, conteudo: conteudo.trim(),
        fotoIds: origem === 'fotos' ? fotoIds : [], criadoEm: new Date().toISOString() });
      onFechar();
    } catch { setErro('Não foi possível salvar o resumo. Tente novamente.'); setOcupado(false); }
  }

  return (
    <Sheet titulo={revisando ? 'Revise seu resumo' : 'Novo resumo'} onFechar={onFechar}
      footer={<button className="btn-primary btn-block" disabled={ocupado || (revisando ? !titulo.trim() || !conteudo.trim() : !temFonte)} onClick={revisando ? salvar : gerar}>
        {ocupado ? <span className="spinner" /> : revisando ? <Check size={17} /> : <Sparkles size={17} />}
        {ocupado ? 'Aguarde…' : revisando ? 'Salvar resumo' : 'Gerar resumo com IA'}
      </button>}>
      <fieldset disabled={ocupado} className="form-sem-borda">
        <label className="campo"><span className="campo-label">Nome do resumo</span>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Cinemática — aula 3" />
        </label>
        <MateriaSelect value={materiaId} onChange={setMateriaId} />
        {revisando ? <>
          <p className="campo-ajuda">Confira os conceitos e ajuste o texto antes de salvar.</p>
          <label className="campo"><span className="campo-label">Conteúdo do resumo</span>
            <textarea rows={13} value={conteudo} onChange={e => setConteudo(e.target.value)} />
          </label>
          <button className="btn-ghost" onClick={() => setRevisando(false)}>Voltar ao material</button>
        </> : <>
          <Segmented itens={[{ id: 'fotos', label: 'Usar fotos' }, { id: 'texto', label: 'Colar texto' }]} valor={origem} onChange={setOrigem} rotulo="Origem do resumo" />
          {origem === 'texto' ? <>
            <label className="campo"><span className="campo-label">Material da aula</span>
              <textarea rows={9} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Cole suas anotações ou o conteúdo da aula aqui…" />
            </label>
            <button className="btn-ghost btn-block" disabled={!texto.trim()} onClick={() => { setConteudo(texto); setRevisando(true); }}>Usar este texto como resumo</button>
          </> : <>
            <p className="campo-ajuda">{fotos.length ? `${fotoIds.length} foto(s) selecionada(s)` : 'Envie fotos na Galeria ou escolha Colar texto para começar.'}</p>
            <div className="galeria-grid">{fotos.map(f => <button key={f.id} className={`galeria-item ${fotoIds.includes(f.id!) ? 'galeria-item-selecionada' : ''}`}
              aria-label="Selecionar foto" aria-pressed={fotoIds.includes(f.id!)} onClick={() => setFotoIds(ids => ids.includes(f.id!) ? ids.filter(id => id !== f.id) : [...ids, f.id!])}>
              <FotoThumb blob={f.blob} />{fotoIds.includes(f.id!) && <span className="check-selecionado"><Check size={14} /></span>}
            </button>)}</div>
          </>}
        </>}
      </fieldset>
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
    </Sheet>
  );
}
