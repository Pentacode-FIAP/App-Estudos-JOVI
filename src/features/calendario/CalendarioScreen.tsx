import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarPlus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { db } from '../../lib/db';
import { dataLocal } from '../../lib/date';
import { PlanoProva } from './PlanoProva';
import { EventoForm } from './EventoForm';
import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';
import { useConfirmacao } from '../../components/ConfirmDialog';
import type { Evento } from '../../types';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const ROTULO_TIPO: Record<Evento['tipo'], string> = {
  prova: 'Prova',
  atividade: 'Atividade',
  revisao: 'Revisão',
};

function isoData(d: Date): string {
  return dataLocal(d);
}

export function CalendarioScreen() {
  const [planoId, setPlanoId] = useState<number | null>(null);
  const [referencia, setReferencia] = useState(() => new Date());
  const [selecionado, setSelecionado] = useState(() => isoData(new Date()));
  const [formAberto, setFormAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | undefined>(undefined);
  const { confirmar, dialogoConfirmacao } = useConfirmacao();

  const eventos = useLiveQuery(() => db.eventos.toArray(), []) ?? [];
  const materias = useLiveQuery(() => db.materias.toArray(), []) ?? [];

  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  const hoje = isoData(new Date());

  const dias = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1);
    const inicioOffset = primeiroDia.getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const celulas: (Date | null)[] = [];
    for (let i = 0; i < inicioOffset; i++) celulas.push(null);
    for (let d = 1; d <= totalDias; d++) celulas.push(new Date(ano, mes, d));
    return celulas;
  }, [ano, mes]);

  const eventosPorData = useMemo(() => {
    const mapa = new Map<string, Evento[]>();
    for (const ev of eventos) {
      const lista = mapa.get(ev.data) ?? [];
      lista.push(ev);
      mapa.set(ev.data, lista);
    }
    return mapa;
  }, [eventos]);

  const proximos = useMemo(
    () => eventos.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data)),
    [eventos, hoje],
  );

  function materiaNome(id?: number) {
    return materias.find((m) => m.id === id)?.nome;
  }

  function novoLembrete() {
    setEventoEditando(undefined);
    setFormAberto(true);
  }

  function editarEvento(evento: Evento) {
    setEventoEditando(evento);
    setFormAberto(true);
  }

  async function excluirEvento(evento: Evento) {
    if (evento.id === undefined) return;
    const ok = await confirmar({
      titulo: 'Excluir lembrete',
      descricao: `“${evento.titulo}” será removido do calendário. Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      destrutivo: true,
    });
    if (ok) await db.eventos.delete(evento.id);
  }

  return (
    <>
      <ScreenHeader
        title="Calendário"
        subtitle="Provas, entregas e revisões"
        actions={
          <button
            className="btn-primary btn-icon"
            onClick={novoLembrete}
            aria-label="Criar novo lembrete"
            title="Novo lembrete"
          >
            <CalendarPlus size={20} strokeWidth={2} />
          </button>
        }
      />

      <div className="screen-body">
        <div className="calendario">
          <div className="calendario-header">
            <button onClick={() => setReferencia(new Date(ano, mes - 1, 1))} aria-label="Mês anterior">
              <ChevronLeft size={19} strokeWidth={2.2} />
            </button>
            <span className="calendario-mes">
              {MESES[mes]} {ano}
            </span>
            <button onClick={() => setReferencia(new Date(ano, mes + 1, 1))} aria-label="Próximo mês">
              <ChevronRight size={19} strokeWidth={2.2} />
            </button>
          </div>

          <div className="calendario-grid" aria-hidden="true">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className="calendario-dia-semana">
                {d}
              </div>
            ))}
          </div>

          {/* A key troca a cada mês, então a grade refaz a animação de entrada. */}
          <div key={`${ano}-${mes}`} className="calendario-grid calendario-grid-dias">
            {dias.map((data, i) => {
              if (!data) return <div key={i} />;
              const iso = isoData(data);
              const doDia = eventosPorData.get(iso) ?? [];
              const ativo = iso === selecionado;
              const ehHoje = iso === hoje;
              const classes = [
                'calendario-dia',
                ativo ? 'calendario-dia-ativo' : '',
                ehHoje && !ativo ? 'calendario-dia-hoje' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={i}
                  className={classes}
                  aria-pressed={ativo}
                  aria-label={`${data.getDate()} de ${MESES[mes]}${doDia.length ? `, ${doDia.length} lembrete(s)` : ''}`}
                  onClick={() => setSelecionado(iso)}
                >
                  {data.getDate()}
                  {doDia.length > 0 && (
                    <span className="calendario-pontos" aria-hidden="true">
                      {doDia.slice(0, 3).map((ev, k) => (
                        <span
                          key={k}
                          className="calendario-ponto"
                          style={ativo ? undefined : { background: `var(--${ev.tipo})` }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className="secao-titulo">Próximos</h3>
        {proximos.length === 0 ? (
          <EmptyState
            Icone={CalendarPlus}
            titulo="Agenda livre"
            descricao="Nenhuma prova, entrega ou revisão marcada daqui pra frente."
            acao={{ rotulo: 'Criar lembrete', onClick: novoLembrete }}
          />
        ) : (
          <ul className="lista stagger">
            {proximos.map((ev) => (
              <li key={ev.id} className="card card-linha evento-com-plano">
                <div className="evento-data">
                  {ev.data.slice(8, 10)}
                  <span>{MESES[Number(ev.data.slice(5, 7)) - 1].slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="evento-info">
                  <span className="card-titulo">{ev.titulo}</span>
                  <span className="evento-materia">
                    {materiaNome(ev.materiaId) ?? 'Sem matéria'}
                  </span>
                  <span className={`pill pill-${ev.tipo}`} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    {ROTULO_TIPO[ev.tipo]}
                  </span>
                </div>
                <div className="item-actions">
                  <button
                    className="btn-icon-sm"
                    onClick={() => editarEvento(ev)}
                    aria-label={`Editar ${ev.titulo}`}
                  >
                    <Pencil size={16} strokeWidth={2} />
                  </button>
                  <button
                    className="btn-icon-sm item-action-danger"
                    onClick={() => excluirEvento(ev)}
                    aria-label={`Excluir ${ev.titulo}`}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
                {ev.tipo === 'prova' && <button className="btn-primary btn-block evento-preparar" onClick={() => setPlanoId(ev.id!)}>Me preparar para esta prova</button>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {formAberto && (
        <EventoForm
          dataInicial={selecionado}
          evento={eventoEditando}
          onFechar={() => setFormAberto(false)}
        />
      )}
      {planoId !== null && <PlanoProva eventoId={planoId} onFechar={() => setPlanoId(null)} />}
      {dialogoConfirmacao}
    </>
  );
}
