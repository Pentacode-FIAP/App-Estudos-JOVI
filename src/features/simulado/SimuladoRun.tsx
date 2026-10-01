import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QuestaoCard } from '../../components/QuestaoCard';
import { Sheet } from '../../components/Sheet';
import { useConfirmacao } from '../../components/ConfirmDialog';
import { db } from '../../lib/db';
import { diaLocal } from '../../lib/progresso';
import type { Simulado, Tentativa } from '../../types';

function mmss(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SimuladoRun({
  simulado,
  onFinalizar,
  onFechar,
}: {
  simulado: Simulado;
  onFinalizar: (id: number) => void;
  onFechar: () => void;
}) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<(number | undefined)[]>(
    () => Array(simulado.itens.length).fill(undefined),
  );
  const [restante, setRestante] = useState<number | null>(
    simulado.minutos ? simulado.minutos * 60 : null,
  );
  const { confirmar, dialogoConfirmacao } = useConfirmacao();
  const [finalizando, setFinalizando] = useState(false);
  // Ref, não só o state: dois cliques podem chegar antes de um re-render, e o
  // state por si só não bloquearia a segunda chamada de `finalizar` a tempo
  // de evitar um `bulkAdd` duplicado (nota em dobro).
  const finalizandoRef = useRef(false);

  const emBranco = respostas.filter((r) => r === undefined).length;

  async function finalizar() {
    if (finalizandoRef.current) return;
    finalizandoRef.current = true;
    setFinalizando(true);
    const agora = new Date();
    // Gravadas em lote no fim, não a cada escolha: durante a prova o aluno
    // ainda pode trocar de resposta.
    const tentativas: Tentativa[] = respostas.flatMap((escolha, i) => {
      if (escolha === undefined) return [];
      return [{
        origem: 'simulado' as const,
        origemId: simulado.id!,
        itemIndex: i,
        materiaId: simulado.materiaId,
        dificuldade: simulado.itens[i].dificuldade,
        escolha,
        acertou: escolha === simulado.itens[i].correta,
        dia: diaLocal(agora),
        respondidoEm: agora.toISOString(),
      }];
    });

    await db.transaction('rw', db.tentativas, db.simulados, async () => {
      if (tentativas.length > 0) await db.tentativas.bulkAdd(tentativas);
      await db.simulados.update(simulado.id!, { finalizadoEm: agora.toISOString() });
    });
    onFinalizar(simulado.id!);
  }

  // Ref para o cronômetro não precisar de `finalizar` nas dependências.
  const finalizarRef = useRef(finalizar);
  finalizarRef.current = finalizar;

  useEffect(() => {
    if (restante === null) return;
    if (restante <= 0) {
      void finalizarRef.current();
      return;
    }
    const id = setTimeout(() => setRestante((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [restante]);

  async function tentarFinalizar() {
    if (emBranco > 0) {
      const ok = await confirmar({
        titulo: 'Finalizar simulado',
        descricao: `${emBranco} ${emBranco === 1 ? 'questão está' : 'questões estão'} em branco e ${emBranco === 1 ? 'contará' : 'contarão'} como erro.`,
        rotuloConfirmar: 'Finalizar',
      });
      if (!ok) return;
    }
    await finalizar();
  }

  function responder(alternativa: number) {
    setRespostas((atual) => atual.map((r, i) => (i === indice ? alternativa : r)));
  }

  return (
    <>
      <Sheet
        titulo={restante === null ? 'Simulado' : `Simulado · ${mmss(restante)}`}
        onFechar={onFechar}
        footer={
          <button className="btn-primary btn-block" onClick={tentarFinalizar} disabled={finalizando}>
            Finalizar simulado
          </button>
        }
      >
        <div className="simulado-grade" role="group" aria-label="Ir para questão">
          {simulado.itens.map((_, i) => (
            <button
              key={i}
              type="button"
              className="simulado-quadro"
              data-atual={i === indice}
              data-respondida={respostas[i] !== undefined}
              aria-current={i === indice ? 'true' : undefined}
              aria-label={`Questão ${i + 1}${respostas[i] === undefined ? ', em branco' : ', respondida'}`}
              onClick={() => setIndice(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <QuestaoCard
          key={indice}
          item={simulado.itens[indice]}
          numero={indice + 1}
          total={simulado.itens.length}
          escolha={respostas[indice]}
          // Modo prova: nunca revela antes de finalizar.
          revelado={false}
          onEscolher={responder}
        />

        <div className="simulado-nav">
          <button
            className="btn-ghost"
            onClick={() => setIndice((n) => n - 1)}
            disabled={indice === 0}
          >
            <ChevronLeft size={17} strokeWidth={2} />
            Anterior
          </button>
          <button
            className="btn-ghost"
            onClick={() => setIndice((n) => n + 1)}
            disabled={indice + 1 >= simulado.itens.length}
          >
            Próxima
            <ChevronRight size={17} strokeWidth={2} />
          </button>
        </div>
      </Sheet>

      {dialogoConfirmacao}
    </>
  );
}
