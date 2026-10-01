import { db } from './db';
import { dataLocal } from './date';
import { diaLocal } from './progresso';
import type {
  Anotacao,
  ChatMessage,
  Evento,
  ExercicioItem,
  Tentativa,
} from '../types';

const CORES = { matematica: '#2563eb', historia: '#b45309', biologia: '#047857', fisica: '#7c3aed' };

function dataNDiasAtras(dias: number, hora = 19): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, 0, 0, 0);
  return d;
}

/** Canvas em vez de asset embutido: gera a "foto de caderno" sem depender de rede na hora do pitch. */
function criarFotoPlaceholder(titulo: string, linhas: string[]): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 960;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fdfaf3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ddd6c4';
  ctx.lineWidth = 1;
  for (let y = 150; y < canvas.height - 40; y += 42) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width - 40, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(titulo, 44, 90);
  ctx.font = '22px sans-serif';
  linhas.forEach((linha, i) => ctx.fillText(linha, 48, 178 + i * 42));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob falhou'))), 'image/png');
  });
}

const ITENS_MATEMATICA: ExercicioItem[] = [
  { pergunta: 'Qual é o valor de f(x) = x² - 4 quando x = 2?', dificuldade: 'facil', alternativas: ['0', '2', '4', '-4'], correta: 0, resposta: '2² - 4 = 4 - 4 = 0.' },
  { pergunta: 'O gráfico de uma função do 2º grau é chamado de:', dificuldade: 'facil', alternativas: ['Reta', 'Parábola', 'Hipérbole', 'Círculo'], correta: 1, resposta: 'Toda função quadrática tem gráfico em forma de parábola.' },
  { pergunta: 'Na função f(x) = ax² + bx + c, se a > 0 a parábola tem concavidade para:', dificuldade: 'facil', alternativas: ['Baixo', 'Esquerda', 'Cima', 'Direita'], correta: 2, resposta: 'a > 0 abre a concavidade para cima.' },
  { pergunta: 'As raízes de x² - 5x + 6 = 0 são:', dificuldade: 'medio', alternativas: ['1 e 6', '2 e 3', '-2 e -3', '2 e -3'], correta: 1, resposta: 'Fatorando: (x-2)(x-3) = 0, logo x = 2 ou x = 3.' },
  { pergunta: 'O vértice da parábola y = x² - 4x + 3 tem coordenada x igual a:', dificuldade: 'medio', alternativas: ['1', '2', '3', '4'], correta: 1, resposta: 'xv = -b/2a = 4/2 = 2.' },
  { pergunta: 'O discriminante (Δ) de x² + 2x + 5 = 0 é:', dificuldade: 'medio', alternativas: ['16', '4', '-4', '-16'], correta: 3, resposta: 'Δ = b² - 4ac = 4 - 20 = -16.' },
  { pergunta: 'Quantas raízes reais tem a equação x² + 2x + 5 = 0?', dificuldade: 'dificil', alternativas: ['Duas distintas', 'Uma', 'Duas iguais', 'Nenhuma'], correta: 3, resposta: 'Δ < 0 (= -16), então não há raízes reais.' },
  { pergunta: 'Para que valores de k a equação x² - 2x + k = 0 tem raízes reais e distintas?', dificuldade: 'dificil', alternativas: ['k < 1', 'k > 1', 'k = 1', 'k < 0'], correta: 0, resposta: 'Δ > 0 exige 4 - 4k > 0, ou seja, k < 1.' },
];

const ITENS_BIOLOGIA: ExercicioItem[] = [
  { pergunta: 'A membrana plasmática é composta principalmente por:', dificuldade: 'facil', alternativas: ['Celulose', 'Bicamada lipídica', 'Amido', 'Colágeno'], correta: 1, resposta: 'A membrana é formada por uma bicamada de fosfolipídios.' },
  { pergunta: 'A organela responsável pela respiração celular é:', dificuldade: 'facil', alternativas: ['Ribossomo', 'Lisossomo', 'Mitocôndria', 'Golgi'], correta: 2, resposta: 'A mitocôndria produz ATP através da respiração celular.' },
  { pergunta: 'Qual estrutura só existe em células vegetais?', dificuldade: 'facil', alternativas: ['Núcleo', 'Parede celular', 'Membrana plasmática', 'Citoplasma'], correta: 1, resposta: 'A parede celular, feita de celulose, é exclusiva das células vegetais.' },
  { pergunta: 'Os ribossomos são responsáveis por:', dificuldade: 'medio', alternativas: ['Digestão celular', 'Síntese de proteínas', 'Fotossíntese', 'Divisão celular'], correta: 1, resposta: 'Os ribossomos traduzem o RNA mensageiro em proteínas.' },
  { pergunta: 'O retículo endoplasmático liso está associado à:', dificuldade: 'medio', alternativas: ['Síntese de proteínas', 'Respiração celular', 'Síntese de lipídios', 'Fotossíntese'], correta: 2, resposta: 'O REL sintetiza lipídios e ajuda na desintoxicação da célula.' },
  { pergunta: 'O núcleo celular contém:', dificuldade: 'medio', alternativas: ['Apenas água', 'Cloroplastos', 'Material genético (DNA)', 'Só proteínas'], correta: 2, resposta: 'O núcleo abriga o DNA, que carrega a informação genética.' },
  { pergunta: 'Em qual fase da mitose os cromossomos se alinham no centro da célula?', dificuldade: 'dificil', alternativas: ['Prófase', 'Metáfase', 'Anáfase', 'Telófase'], correta: 1, resposta: 'Na metáfase os cromossomos se organizam na placa equatorial.' },
  { pergunta: 'A diferença fundamental entre células procariontes e eucariontes é:', dificuldade: 'dificil', alternativas: ['Ausência de citoplasma', 'Ausência de DNA', 'Ausência de núcleo organizado nas procariontes', 'Ausência de membrana plasmática'], correta: 2, resposta: 'Procariontes não têm núcleo delimitado por membrana; eucariontes têm.' },
];

const ITENS_HISTORIA: ExercicioItem[] = [
  { pergunta: 'A Revolução Industrial teve início em qual país?', dificuldade: 'facil', alternativas: ['França', 'Inglaterra', 'Alemanha', 'Estados Unidos'], correta: 1, resposta: 'A Inglaterra reunia capital, mão de obra e matéria-prima para iniciar o processo.' },
  { pergunta: 'Qual máquina é símbolo da Primeira Revolução Industrial?', dificuldade: 'facil', alternativas: ['Computador', 'Automóvel', 'Máquina a vapor', 'Avião'], correta: 2, resposta: 'A máquina a vapor, aperfeiçoada por James Watt, moveu a indústria têxtil e os transportes.' },
  { pergunta: 'O êxodo rural durante a Revolução Industrial se refere a:', dificuldade: 'facil', alternativas: ['Migração das cidades para o campo', 'Fim da agricultura', 'Migração do campo para as cidades', 'Criação de novas fazendas'], correta: 2, resposta: 'Trabalhadores deixaram o campo em busca de emprego nas fábricas urbanas.' },
  { pergunta: 'O sistema de produção baseado em fábricas substituiu principalmente:', dificuldade: 'medio', alternativas: ['O comércio marítimo', 'O trabalho artesanal', 'A agricultura de subsistência', 'O escambo'], correta: 1, resposta: 'As fábricas substituíram o modelo artesanal e doméstico de produção.' },
  { pergunta: 'A Segunda Revolução Industrial é marcada pelo uso de:', dificuldade: 'medio', alternativas: ['Vapor e carvão', 'Energia nuclear', 'Eletricidade e petróleo', 'Energia solar'], correta: 2, resposta: 'A partir de 1850, eletricidade e petróleo tornaram-se as novas fontes de energia.' },
  { pergunta: 'As péssimas condições de trabalho nas fábricas levaram ao surgimento de:', dificuldade: 'medio', alternativas: ['Feudalismo', 'Sindicatos e movimentos operários', 'Escravidão colonial', 'Monarquias absolutistas'], correta: 1, resposta: 'Trabalhadores se organizaram em sindicatos para reivindicar direitos.' },
  { pergunta: 'O ludismo foi um movimento que:', dificuldade: 'dificil', alternativas: ['Defendia a industrialização acelerada', 'Criava novas tecnologias', 'Destruía máquinas em protesto ao desemprego', 'Apoiava os donos de fábrica'], correta: 2, resposta: 'Os luditas culpavam as máquinas pelo desemprego e as destruíam em protesto.' },
  { pergunta: 'Um dos principais efeitos sociais da Revolução Industrial foi:', dificuldade: 'dificil', alternativas: ['O fim das cidades', 'A volta ao feudalismo', 'A eliminação do capitalismo', 'O surgimento do proletariado urbano'], correta: 3, resposta: 'A nova classe operária urbana, o proletariado, surgiu do trabalho fabril.' },
];

function gerarLote(params: {
  itens: ExercicioItem[];
  materiaId: number;
  origem: Tentativa['origem'];
  origemId: number;
  diasAtras: number[];
  porDia: number;
  acerto: number;
}): Tentativa[] {
  const lote: Tentativa[] = [];
  for (const dias of params.diasAtras) {
    const base = dataNDiasAtras(dias);
    const dia = diaLocal(base);
    for (let i = 0; i < params.porDia; i++) {
      const itemIndex = i % params.itens.length;
      const item = params.itens[itemIndex];
      const correta = item.correta ?? 0;
      const acertou = Math.random() < params.acerto;
      const escolha = acertou ? correta : (correta + 1 + Math.floor(Math.random() * 3)) % 4;
      lote.push({
        origem: params.origem,
        origemId: params.origemId,
        itemIndex,
        materiaId: params.materiaId,
        dificuldade: item.dificuldade,
        escolha,
        acertou,
        dia,
        respondidoEm: new Date(base.getTime() + i * 45_000).toISOString(),
      });
    }
  }
  return lote;
}

function intervalo(inicio: number, fim: number): number[] {
  const dias: number[] = [];
  for (let d = inicio; d >= fim; d--) dias.push(d);
  return dias;
}

export async function seedDemoData(): Promise<void> {
  const fotoMatBlob = await criarFotoPlaceholder('Bhaskara', [
    'x = (-b ± √Δ) / 2a',
    'Δ = b² - 4ac',
    '',
    'Ex: x² - 5x + 6 = 0',
    'Δ = 25 - 24 = 1',
    'x = (5 ± 1) / 2 → 2 ou 3',
  ]);
  const fotoBioBlob = await criarFotoPlaceholder('Célula', [
    'Membrana plasmática',
    'Núcleo → DNA',
    'Mitocôndria → ATP',
    'Ribossomo → proteínas',
    'REL → lipídios',
  ]);

  await db.transaction(
    'rw',
    [db.materias, db.eventos, db.fotos, db.resumos, db.exercicios, db.anotacoes, db.chatMessages, db.tentativas, db.simulados, db.config],
    async () => {
      await Promise.all([
        db.materias.clear(),
        db.eventos.clear(),
        db.fotos.clear(),
        db.resumos.clear(),
        db.exercicios.clear(),
        db.anotacoes.clear(),
        db.chatMessages.clear(),
        db.tentativas.clear(),
        db.simulados.clear(),
        db.config.clear(),
      ]);

      const matematicaId = await db.materias.add({ nome: 'Matemática', cor: CORES.matematica });
      const historiaId = await db.materias.add({ nome: 'História', cor: CORES.historia });
      const biologiaId = await db.materias.add({ nome: 'Biologia', cor: CORES.biologia });
      const fisicaId = await db.materias.add({ nome: 'Física', cor: CORES.fisica });

      const fotoMatId = await db.fotos.add({
        blob: fotoMatBlob,
        materiaId: matematicaId,
        dataUpload: dataNDiasAtras(6).toISOString(),
        ocrText: 'x = (-b ± √Δ) / 2a\nΔ = b² - 4ac\n\nEx: x² - 5x + 6 = 0\nΔ = 25 - 24 = 1\nx = (5 ± 1) / 2 → 2 ou 3',
      });
      const fotoBioId = await db.fotos.add({
        blob: fotoBioBlob,
        materiaId: biologiaId,
        dataUpload: dataNDiasAtras(4).toISOString(),
        ocrText: 'Membrana plasmática\nNúcleo → DNA\nMitocôndria → ATP\nRibossomo → proteínas\nREL → lipídios',
      });

      const resumoMatId = await db.resumos.add({
        titulo: 'Funções do 2º grau',
        materiaId: matematicaId,
        conteudo:
          'Uma função do 2º grau tem a forma f(x) = ax² + bx + c, com a ≠ 0. Seu gráfico é uma parábola: ' +
          'concavidade para cima quando a > 0, para baixo quando a < 0. As raízes (quando existem) são dadas ' +
          'pela fórmula de Bhaskara, usando o discriminante Δ = b² - 4ac. Se Δ > 0 há duas raízes reais e ' +
          'distintas, se Δ = 0 há uma raiz dupla, e se Δ < 0 não há raízes reais.',
        fotoIds: [fotoMatId],
        criadoEm: dataNDiasAtras(6).toISOString(),
      });
      const resumoBioId = await db.resumos.add({
        titulo: 'Citologia: estrutura da célula',
        materiaId: biologiaId,
        conteudo:
          'A célula é a unidade básica da vida. A membrana plasmática, formada por uma bicamada lipídica, ' +
          'controla a entrada e saída de substâncias. O núcleo guarda o DNA. A mitocôndria realiza a ' +
          'respiração celular, produzindo ATP. Os ribossomos sintetizam proteínas, e o retículo ' +
          'endoplasmático liso sintetiza lipídios.',
        fotoIds: [fotoBioId],
        criadoEm: dataNDiasAtras(4).toISOString(),
      });
      const resumoHistId = await db.resumos.add({
        titulo: 'Revolução Industrial',
        materiaId: historiaId,
        conteudo:
          'Iniciada na Inglaterra no fim do século XVIII, a Revolução Industrial substituiu a produção ' +
          'artesanal pelo sistema fabril. A máquina a vapor foi central na Primeira Revolução; a partir de ' +
          '1850, eletricidade e petróleo marcaram a Segunda. O processo gerou êxodo rural, formação do ' +
          'proletariado urbano e, em resposta às condições de trabalho, os primeiros sindicatos.',
        fotoIds: [],
        criadoEm: dataNDiasAtras(20).toISOString(),
      });

      const exercicioMatId = await db.exercicios.add({ resumoId: resumoMatId, itens: ITENS_MATEMATICA, criadoEm: dataNDiasAtras(6).toISOString() });
      const exercicioBioId = await db.exercicios.add({ resumoId: resumoBioId, itens: ITENS_BIOLOGIA, criadoEm: dataNDiasAtras(4).toISOString() });
      const exercicioHistId = await db.exercicios.add({ resumoId: resumoHistId, itens: ITENS_HISTORIA, criadoEm: dataNDiasAtras(20).toISOString() });

      const eventos: Evento[] = [
        { titulo: 'Prova de Funções do 2º Grau', data: dataLocal(dataNDiasAtras(-5)), materiaId: matematicaId, tipo: 'prova', resumoIds: [resumoMatId] },
        { titulo: 'Entrega de lista de exercícios', data: dataLocal(dataNDiasAtras(-2)), materiaId: matematicaId, tipo: 'atividade' },
        { titulo: 'Revisão de Citologia', data: dataLocal(dataNDiasAtras(1)), materiaId: biologiaId, tipo: 'revisao' },
        { titulo: 'Prova de Citologia', data: dataLocal(dataNDiasAtras(-10)), materiaId: biologiaId, tipo: 'prova', resumoIds: [resumoBioId] },
        { titulo: 'Seminário de Revolução Industrial', data: dataLocal(dataNDiasAtras(-7)), materiaId: historiaId, tipo: 'atividade' },
        { titulo: 'Prova de História', data: dataLocal(dataNDiasAtras(-14)), materiaId: historiaId, tipo: 'prova', resumoIds: [resumoHistId] },
        { titulo: 'Prova de Física — Cinemática', data: dataLocal(dataNDiasAtras(-20)), materiaId: fisicaId, tipo: 'prova' },
      ];
      await db.eventos.bulkAdd(eventos);

      const anotacoes: Anotacao[] = [
        { titulo: 'Dúvida sobre Bhaskara', conteudo: 'Ainda confundo o sinal do discriminante quando ele é negativo. Perguntar pro professor.', materiaId: matematicaId, resumoId: resumoMatId, data: dataNDiasAtras(2).toISOString() },
        { titulo: 'Ideia pro seminário', conteudo: 'Trazer exemplos de fábricas têxteis inglesas do século 18 pra ilustrar a apresentação.', materiaId: historiaId, resumoId: resumoHistId, data: dataNDiasAtras(1).toISOString() },
      ];
      await db.anotacoes.bulkAdd(anotacoes);

      const chatMessages: ChatMessage[] = [
        { role: 'user', texto: 'Pode revisar rapidamente Bhaskara comigo?', criadoEm: dataNDiasAtras(0, 10).toISOString() },
        { role: 'assistant', texto: 'Claro! Δ = b² - 4ac. Se Δ > 0, duas raízes reais e distintas: x = (-b ± √Δ) / 2a. Quer que eu monte um exemplo com seu resumo de Funções do 2º grau?', criadoEm: dataNDiasAtras(0, 10).toISOString() },
        { role: 'user', texto: 'Quais tópicos de Citologia caem mais?', criadoEm: dataNDiasAtras(0, 11).toISOString() },
        { role: 'assistant', texto: 'Pelas suas anotações, organelas e suas funções (mitocôndria, ribossomo, núcleo) aparecem mais. Vale revisar também as fases da mitose.', criadoEm: dataNDiasAtras(0, 11).toISOString() },
      ];
      await db.chatMessages.bulkAdd(chatMessages);

      const simuladoMatIniciado = dataNDiasAtras(3, 15);
      const simuladoMatId = await db.simulados.add({
        materiaId: matematicaId,
        resumoIds: [resumoMatId],
        itens: ITENS_MATEMATICA,
        qtd: ITENS_MATEMATICA.length,
        nivel: 'misto',
        minutos: 30,
        iniciadoEm: simuladoMatIniciado.toISOString(),
        finalizadoEm: new Date(simuladoMatIniciado.getTime() + 22 * 60_000).toISOString(),
      });
      const simuladoBioIniciado = dataNDiasAtras(6, 16);
      const simuladoBioId = await db.simulados.add({
        materiaId: biologiaId,
        resumoIds: [resumoBioId],
        itens: ITENS_BIOLOGIA.slice(0, 5),
        qtd: 5,
        nivel: 'misto',
        iniciadoEm: simuladoBioIniciado.toISOString(),
        finalizadoEm: new Date(simuladoBioIniciado.getTime() + 18 * 60_000).toISOString(),
      });

      const tentativas: Tentativa[] = [
        // Semana anterior: volume alto, acerto mais baixo — base pro "seu acerto subiu" da semana atual.
        ...gerarLote({ itens: ITENS_MATEMATICA, materiaId: matematicaId, origem: 'exercicio', origemId: exercicioMatId, diasAtras: intervalo(13, 7), porDia: 10, acerto: 0.55 }),
        // Esta semana: acerto melhor, e o dia de hoje fica mais fraco de propósito pra alimentar a fila de revisão.
        ...gerarLote({ itens: ITENS_MATEMATICA, materiaId: matematicaId, origem: 'exercicio', origemId: exercicioMatId, diasAtras: intervalo(6, 1), porDia: 9, acerto: 0.8 }),
        ...gerarLote({ itens: ITENS_MATEMATICA, materiaId: matematicaId, origem: 'exercicio', origemId: exercicioMatId, diasAtras: [0], porDia: 8, acerto: 0.5 }),

        ...gerarLote({ itens: ITENS_BIOLOGIA, materiaId: biologiaId, origem: 'exercicio', origemId: exercicioBioId, diasAtras: intervalo(5, 1), porDia: 4, acerto: 0.75 }),
        ...gerarLote({ itens: ITENS_BIOLOGIA, materiaId: biologiaId, origem: 'exercicio', origemId: exercicioBioId, diasAtras: [0], porDia: 8, acerto: 0.5 }),

        // História parada há mais de uma semana — dispara o insight de "matéria parada".
        ...gerarLote({ itens: ITENS_HISTORIA, materiaId: historiaId, origem: 'exercicio', origemId: exercicioHistId, diasAtras: intervalo(20, 16), porDia: 3, acerto: 0.6 }),
      ];

      const tentativasSimuladoMat = ITENS_MATEMATICA.map((item, itemIndex) => {
        const acertou = itemIndex < 6;
        const correta = item.correta ?? 0;
        return {
          origem: 'simulado' as const,
          origemId: simuladoMatId,
          itemIndex,
          materiaId: matematicaId,
          dificuldade: item.dificuldade,
          escolha: acertou ? correta : (correta + 1) % 4,
          acertou,
          dia: diaLocal(simuladoMatIniciado),
          respondidoEm: new Date(simuladoMatIniciado.getTime() + itemIndex * 90_000).toISOString(),
        };
      });
      const tentativasSimuladoBio = ITENS_BIOLOGIA.slice(0, 5).map((item, itemIndex) => {
        const acertou = itemIndex < 3;
        const correta = item.correta ?? 0;
        return {
          origem: 'simulado' as const,
          origemId: simuladoBioId,
          itemIndex,
          materiaId: biologiaId,
          dificuldade: item.dificuldade,
          escolha: acertou ? correta : (correta + 1) % 4,
          acertou,
          dia: diaLocal(simuladoBioIniciado),
          respondidoEm: new Date(simuladoBioIniciado.getTime() + itemIndex * 90_000).toISOString(),
        };
      });

      await db.tentativas.bulkAdd([...tentativas, ...tentativasSimuladoMat, ...tentativasSimuladoBio]);

      await db.config.add({ id: 'app', metaDiaria: 8 });
    },
  );
}
