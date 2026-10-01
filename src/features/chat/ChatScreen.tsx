import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Send, Sparkles } from 'lucide-react';
import { db } from '../../lib/db';
import { montarContextoChat } from '../../lib/context';
import { enviarMensagemChat } from '../../lib/gemini';
import { Toast } from '../../components/Toast';
import { ScreenHeader } from '../../components/ScreenHeader';

const SUGESTOES = [
  'Do que trata meu último resumo?',
  'O que eu tenho pra essa semana?',
  'Me faça uma pergunta de revisão',
];

export function ChatScreen() {
  const mensagens = useLiveQuery(() => db.chatMessages.orderBy('criadoEm').toArray(), []) ?? [];
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mensagensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mensagensEl = mensagensRef.current;
    if (!mensagensEl) return;
    // A área de mensagens é rolável dentro do frame; acompanhar seu tamanho
    // mantém a conversa na mensagem mais recente após atualizações do Dexie.
    const scrollToEnd = () => {
      mensagensEl.scrollTop = mensagensEl.scrollHeight;
    };
    scrollToEnd();
    const observer = new ResizeObserver(scrollToEnd);
    observer.observe(mensagensEl);
    return () => observer.disconnect();
  }, []);

  async function enviar(conteudoBruto?: string) {
    const conteudo = (conteudoBruto ?? texto).trim();
    if (!conteudo || enviando) return;
    setTexto('');
    setEnviando(true);
    setErro(null);
    try {
      await db.chatMessages.add({ role: 'user', texto: conteudo, criadoEm: new Date().toISOString() });
      const contexto = await montarContextoChat();
      const historico = mensagens.map((m) => ({ role: m.role, texto: m.texto }));
      const resposta = await enviarMensagemChat(contexto, historico, conteudo);
      await db.chatMessages.add({
        role: 'assistant',
        texto: resposta,
        criadoEm: new Date().toISOString(),
      });
    } catch {
      setErro('Erro ao gerar, tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="chat-tela">
      <ScreenHeader title="Chat com a IA" subtitle="Sabe tudo que você já estudou aqui" />

      <div className="chat-mensagens" ref={mensagensRef}>
        {mensagens.length === 0 && !enviando && (
          <div className="empty-state" style={{ border: 0, background: 'none', marginTop: 'auto' }}>
            <span className="empty-icone" aria-hidden="true">
              <Sparkles size={22} strokeWidth={1.75} />
            </span>
            <strong>Pergunte qualquer coisa</strong>
            <p>A IA enxerga seus resumos, anotações e lembretes pra responder com contexto.</p>
            <div className="chat-sugestoes">
              {SUGESTOES.map((s) => (
                <button key={s} className="chat-sugestao" onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m) => (
          <div key={m.id} className={`chat-bolha chat-bolha-${m.role}`}>
            {m.texto}
          </div>
        ))}

        {enviando && (
          <div className="chat-bolha chat-bolha-assistant" role="status" aria-label="Gerando resposta">
            <span className="typing" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
          placeholder="Pergunte algo sobre seus estudos…"
          aria-label="Mensagem"
          disabled={enviando}
        />
        <button
          className="btn-primary btn-icon"
          onClick={() => enviar()}
          disabled={enviando || !texto.trim()}
          aria-label="Enviar mensagem"
        >
          {enviando ? <span className="spinner" aria-hidden="true" /> : <Send size={18} strokeWidth={2} />}
        </button>
      </div>

      {erro && <Toast message={erro} onClose={() => setErro(null)} />}
    </div>
  );
}
