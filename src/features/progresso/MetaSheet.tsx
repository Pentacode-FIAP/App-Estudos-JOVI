import { useState } from 'react';
import { db } from '../../lib/db';
import { Segmented } from '../../components/Segmented';
import { Sheet } from '../../components/Sheet';

type Opcao = '5' | '10' | '15' | '20';

const OPCOES: { id: Opcao; label: string }[] = [
  { id: '5', label: '5' },
  { id: '10', label: '10' },
  { id: '15', label: '15' },
  { id: '20', label: '20' },
];

export function MetaSheet({ metaAtual, onFechar }: { metaAtual: number; onFechar: () => void }) {
  // Se a meta salva não for uma das opções, cai na mais próxima acima.
  const inicial = (OPCOES.find((o) => Number(o.id) >= metaAtual) ?? OPCOES[1]).id;
  const [valor, setValor] = useState<Opcao>(inicial);

  async function salvar() {
    await db.transaction('rw', db.config, async () => {
      const config = await db.config.get('app');
      await db.config.put({ ...config, id: 'app', metaDiaria: Number(valor) });
    });
    onFechar();
  }

  return (
    <Sheet
      titulo="Meta diária"
      onFechar={onFechar}
      footer={
        <button className="btn-primary btn-block" onClick={salvar}>
          Salvar meta
        </button>
      }
    >
      <p className="campo-ajuda" style={{ marginBottom: 14 }}>
        Quantas questões você quer responder por dia. Bater a meta mantém sua ofensiva —
        acertar ou errar não interfere.
      </p>
      <Segmented itens={OPCOES} valor={valor} onChange={setValor} rotulo="Questões por dia" modo="radio" />
    </Sheet>
  );
}
