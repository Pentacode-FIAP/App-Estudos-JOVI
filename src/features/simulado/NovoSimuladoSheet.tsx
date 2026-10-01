import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles } from 'lucide-react';
import { db } from '../../lib/db';
import { gerarSimulado } from '../../lib/gemini';
import { ResumoSelecao } from '../../components/ResumoSelecao';
import { MateriaSelect } from '../../components/MateriaSelect';
import { Segmented } from '../../components/Segmented';
import { Sheet } from '../../components/Sheet';
import { SkeletonCard } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import type { Dificuldade, Simulado } from '../../types';

type Qtd = '5' | '10' | '20' | '30';
type Nivel = Dificuldade | 'misto';
type Tempo = '0' | '30' | '60' | '90';

const QTDS: { id: Qtd; label: string }[] = [
  { id: '5', label: '5' },
  { id: '10', label: '10' },
  { id: '20', label: '20' },
  { id: '30', label: '30' },
];

const NIVEIS: { id: Nivel; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'medio', label: 'Médio' },
  { id: 'dificil', label: 'Difícil' },
  { id: 'misto', label: 'Misto' },
];

const TEMPOS: { id: Tempo; label: string }[] = [
  { id: '0', label: 'Livre' },
  { id: '30', label: '30min' },
  { id: '60', label: '60min' },
  { id: '90', label: '90min' },
];

export function NovoSimuladoSheet({
  onFechar,
  onIniciar,
  materiaInicial,
  resumoIdsIniciais,
}: {
  onFechar: () => void;
  materiaInicial?: number;
  resumoIdsIniciais?: number[];
  /** `aviso` avisa que saiu com menos questões do que o pedido (lote parcial). */
  onIniciar: (simulado: Simulado, aviso?: string) => void;
}) {
  const [materiaId, setMateriaId] = useState<number | undefined>(materiaInicial);
  const [qtd, setQtd] = useState<Qtd>('5');
  const [nivel, setNivel] = useState<Nivel>('misto');
  const [tempo, setTempo] = useState<Tempo>('0');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const resumos = useLiveQuery(
    () => (materiaId === undefined ? [] : db.resumos.where('materiaId').equals(materiaId).toArray()),
    [materiaId],
  ) ?? [];

  const [selecionados, setSelecionados] = useState<number[] | null>(resumoIdsIniciais ?? null);
  const ids = selecionados ?? resumos.map(r => r.id!);
  const fontes = resumos.filter(r => ids.includes(r.id!));

  async function comecar() {
    if (materiaId === undefined || fontes.length === 0 || gerando) return;
    setGerando(true);
    setErro(null);
    try {
      const pedidas = Number(qtd);
      const itens = await gerarSimulado(fontes, { qtd: pedidas, nivel });
      if (!itens.length) throw new Error('Não há questões nesse nível. Escolha Misto.');
      const simulado: Simulado = {
        materiaId,
        resumoIds: fontes.map((r) => r.id!),
        itens,
        qtd: itens.length,
        nivel,
        minutos: tempo === '0' ? undefined : Number(tempo),
        iniciadoEm: new Date().toISOString(),
      };
      const id = await db.simulados.add(simulado);
      // Lote que falha não derruba o simulado (5+ questões já bastam pra
      // começar), mas o aluno merece saber que o exame saiu menor do que pediu.
      const aviso = itens.length < pedidas
        ? `Só deu pra gerar ${itens.length} de ${pedidas} questões pedidas. O simulado começa com o que foi possível gerar.`
        : undefined;
      onIniciar({ ...simulado, id }, aviso);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu pra gerar o simulado.');
    } finally {
      setGerando(false);
    }
  }

  const semResumo = materiaId !== undefined && resumos.length === 0;

  return (
    <Sheet
      titulo="Novo simulado"
      onFechar={onFechar}
      footer={
        <button
          className="btn-primary btn-block"
          onClick={comecar}
          disabled={gerando || materiaId === undefined || fontes.length === 0}
        >
          <Sparkles size={17} strokeWidth={2} />
          Começar simulado
        </button>
      }
    >
      {gerando ? (
        <SkeletonCard linhas={4} rotulo="Montando o simulado com IA" />
      ) : (
        <>
          <MateriaSelect value={materiaId} onChange={id => { setMateriaId(id); setSelecionados(null); }} permitirVazio={false} />

          <ResumoSelecao resumos={resumos} selecionados={ids} onChange={setSelecionados} />
          <label className="campo">
            <span className="campo-label">Questões</span>
            <Segmented itens={QTDS} valor={qtd} onChange={setQtd} rotulo="Número de questões" modo="radio" />
          </label>

          <label className="campo">
            <span className="campo-label">Nível</span>
            <Segmented itens={NIVEIS} valor={nivel} onChange={setNivel} rotulo="Nível das questões" modo="radio" />
          </label>

          <label className="campo">
            <span className="campo-label">Tempo</span>
            <Segmented itens={TEMPOS} valor={tempo} onChange={setTempo} rotulo="Tempo limite" modo="radio" />
          </label>

          <p className="campo-ajuda">
            {semResumo
              ? 'Essa matéria ainda não tem resumo. Crie um resumo antes de montar o simulado.'
              : `${fontes.length} ${fontes.length === 1 ? 'resumo servirá' : 'resumos servirão'} de fonte.`}
          </p>
        </>
      )}

      {erro && <Toast message={erro} onClose={() => setErro(null)} />}
    </Sheet>
  );
}
