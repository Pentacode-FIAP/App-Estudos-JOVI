import { db } from './db';
import { dataLocal } from './date';

function hojeLocal(): string {
  return dataLocal(new Date());
}

export async function montarContextoChat(): Promise<string> {
  const [materias, eventos, resumos, anotacoes, fotos] = await Promise.all([
    db.materias.toArray(),
    db.eventos.toArray(),
    db.resumos.toArray(),
    db.anotacoes.toArray(),
    db.fotos.toArray(),
  ]);

  const materiaNome = (id?: number) => materias.find((m) => m.id === id)?.nome ?? 'sem matéria';

  const linhas: string[] = [];
  linhas.push('Você é um assistente de estudos com acesso a tudo que o aluno já cadastrou no app.');

  linhas.push('\nMatérias cadastradas: ' + (materias.map((m) => m.nome).join(', ') || 'nenhuma'));

  const hoje = hojeLocal();
  const proximos = eventos.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  linhas.push('\nPróximos eventos:');
  for (const e of proximos) {
    linhas.push(`- ${e.data} (${e.tipo}) ${e.titulo} — ${materiaNome(e.materiaId)}`);
  }

  linhas.push('\nResumos disponíveis:');
  for (const r of resumos) {
    linhas.push(`- "${r.titulo}" (${materiaNome(r.materiaId)}): ${r.conteudo}`);
  }

  linhas.push('\nAnotações:');
  for (const a of anotacoes) {
    linhas.push(`- "${a.titulo}": ${a.conteudo}`);
  }

  const textosOcr = fotos.filter((f) => f.ocrText);
  if (textosOcr.length) {
    linhas.push('\nTexto extraído de fotos (OCR):');
    for (const f of textosOcr) {
      linhas.push(`- ${f.ocrText}`);
    }
  }

  return linhas.join('\n');
}
