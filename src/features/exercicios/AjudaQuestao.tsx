import { useEffect, useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import { db } from '../../lib/db';
import { ajudarQuestao } from '../../lib/gemini';
import type { ExercicioItem } from '../../types';

export function AjudaQuestao({ item, escolha, revelado, origem, origemId }: {
  item: ExercicioItem; escolha?: number; revelado: boolean;
  origem: 'exercicio' | 'simulado'; origemId: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [resposta, setResposta] = useState('');
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    setResposta(''); setErro('');
    async function carregar() {
      try {
        const exercicio = origem === 'exercicio' ? await db.exercicios.get(origemId) : undefined;
        const simulado = origem === 'simulado' ? await db.simulados.get(origemId) : undefined;
        const ids = exercicio ? [exercicio.resumoId] : simulado?.resumoIds ?? [];
        const resumos = await db.resumos.bulkGet(ids);
        const texto = await ajudarQuestao(item, escolha, revelado, resumos.filter(Boolean).map(r => `${r!.titulo}: ${r!.conteudo}`).join('\n\n'));
        if (ativo) setResposta(texto);
      } catch { if (ativo) setErro('Não consegui responder agora. Tente novamente.'); }
    }
    void carregar();
    return () => { ativo = false; };
  }, [aberto, item, escolha, revelado, origem, origemId, tentativa]);
  const rotulo = !revelado ? 'Pedir uma dica' : escolha === item.correta ? 'Entender o raciocínio' : 'Me explica por que errei';
  return <>
    <button className="link-acao" onClick={() => setAberto(true)}>{revelado ? <Sparkles size={17} /> : <Lightbulb size={17} />}{rotulo}</button>
    {aberto && <Sheet titulo={revelado ? 'Vamos entender juntos' : 'Uma dica para começar'} onFechar={() => setAberto(false)}
      footer={<button className="btn-primary btn-block" onClick={() => setAberto(false)}>{revelado ? 'Entendi, continuar' : 'Voltar e tentar'}</button>}>
      <div className="tutor-contexto"><span className="campo-label">Sua questão</span><p>{item.pergunta}</p>
        {revelado && escolha !== undefined && <p className="meta">Sua escolha: {item.alternativas?.[escolha]}</p>}
      </div>
      <div className="tutor-resposta" aria-live="polite">
        <span className="campo-label"><Sparkles size={16} /> Tutor IA</span>
        {resposta ? <p>{resposta}</p> : erro ? <><p role="alert">{erro}</p><button onClick={() => setTentativa(n => n + 1)}>Tentar novamente</button></> : <p role="status"><span className="spinner" /> Pensando em como te ajudar…</p>}
      </div>
    </Sheet>}
  </>;
}
