import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { QuestaoCard } from '../../components/QuestaoCard';
import { Sheet } from '../../components/Sheet';
import { db } from '../../lib/db';
import { diaLocal } from '../../lib/progresso';
import { AjudaQuestao } from './AjudaQuestao';
import { ResultadoSerie } from './ResultadoSerie';
import type { ExercicioItem, Tentativa } from '../../types';

/** Uma questão com o ponteiro de onde ela veio — a fila de revisão mistura origens. */
export interface QuestaoDaSerie {
  item: ExercicioItem;
  origem: 'exercicio' | 'simulado';
  origemId: number;
  itemIndex: number;
  materiaId?: number;
}

export function SerieExercicios({
  titulo,
  questoes,
  onFechar,
  onRefazer,
  onConcluir,
}: {
  titulo: string;
  questoes: QuestaoDaSerie[];
  onFechar: () => void;
  onRefazer?: () => void;
  onConcluir?: () => void;
}) {
  // Uma série em andamento é um conjunto FIXO de questões. `questoes` pode vir
  // de um useLiveQuery (a fila de revisão, por exemplo): responder uma questão
  // corretamente faz ela sair da fila, o live query reexecuta, e o array de
  // props muda NO MEIO da sessão. Sem essa fotografia, `indice` aponta pro
  // lugar errado (ou fica fora dos limites) assim que isso acontece — não
  // "simplifique" isto de volta pra ler `questoes` direto.
  const [snapshot] = useState(() => questoes);

  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<number | undefined>(undefined);
  const [revelado, setRevelado] = useState(false);
  const [respondidas, setRespondidas] = useState<Tentativa[]>([]);
  const [terminou, setTerminou] = useState(false);

  const atual = snapshot[indice];

  async function escolher(alternativa: number) {
    if (revelado) return;
    const agora = new Date();
    const tentativa: Tentativa = {
      origem: atual.origem,
      origemId: atual.origemId,
      itemIndex: atual.itemIndex,
      materiaId: atual.materiaId,
      dificuldade: atual.item.dificuldade,
      escolha: alternativa,
      acertou: alternativa === atual.item.correta,
      // Calculado no momento da resposta: uma série longa pode atravessar a meia-noite.
      dia: diaLocal(agora),
      respondidoEm: agora.toISOString(),
    };

    setEscolha(alternativa);
    setRevelado(true);
    setRespondidas((lista) => [...lista, tentativa]);
    await db.tentativas.add(tentativa);
  }

  function avancar() {
    if (indice + 1 >= snapshot.length) {
      setTerminou(true);
      onConcluir?.();
      return;
    }
    setIndice((n) => n + 1);
    setEscolha(undefined);
    setRevelado(false);
  }

  return (
    <Sheet
      titulo={titulo}
      onFechar={onFechar}
      footer={
        terminou ? (
          <button className="btn-primary btn-block" onClick={onFechar}>
            Concluir
          </button>
        ) : (
          <button className="btn-primary btn-block" onClick={avancar} disabled={!revelado}>
            {indice + 1 >= snapshot.length ? 'Ver resultado' : 'Próxima'}
            <ArrowRight size={17} strokeWidth={2} />
          </button>
        )
      }
    >
      {terminou ? (
        <ResultadoSerie tentativas={respondidas} onRefazer={onRefazer} />
      ) : (
        <><QuestaoCard
          // A key remonta o card a cada questão, reiniciando a animação de entrada.
          key={indice}
          item={atual.item}
          numero={indice + 1}
          total={snapshot.length}
          escolha={escolha}
          revelado={revelado}
          onEscolher={escolher}
        /><AjudaQuestao key={`ajuda-${indice}`} item={atual.item} escolha={escolha} revelado={revelado} origem={atual.origem} origemId={atual.origemId} /></>
      )}
    </Sheet>
  );
}
