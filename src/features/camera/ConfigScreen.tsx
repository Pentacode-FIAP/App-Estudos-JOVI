import { useState, type ReactNode } from 'react';
import styles from './ConfigScreen.module.css';

interface ModoItem {
  nome: string;
  ativo: boolean;
  custom: boolean;
  iconClass: string;
  corLabel?: 'verde' | 'azul';
  icone: ReactNode;
}

const MODOS_INICIAIS: ModoItem[] = [
  {
    nome: 'Alta Resolução',
    ativo: true,
    custom: false,
    iconClass: 'icone-res',
    icone: (
      <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 14.5C21 15.3284 20.3284 16 19.5 16H2.5C1.67157 16 1 15.3284 1 14.5V5.5C1 4.67157 1.67157 4 2.5 4H5.5L7 2H15L16.5 4H19.5C20.3284 4 21 4.67157 21 5.5V14.5Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
        <circle cx="11" cy="10" r="3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
        <circle cx="11" cy="10" r="1.2" fill="rgba(255,255,255,0.5)" />
      </svg>
    ),
  },
  {
    nome: 'Noturno',
    ativo: true,
    custom: false,
    iconClass: 'icone-noturno',
    icone: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 11.5C17.2 15.1 13.9 17.8 10 17.8C5.6 17.8 2 14.3 2 9.9C2 6.3 4.3 3.3 7.5 2.2C6.5 3.5 6 5.1 6 6.8C6 11 9.5 14.4 13.8 14.4C15.4 14.4 16.8 13.9 18 13L18 11.5Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nome: 'Panorâmica',
    ativo: true,
    custom: false,
    iconClass: 'icone-pano',
    icone: (
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="20" height="12" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
        <line x1="7" y1="1" x2="7" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <line x1="15" y1="1" x2="15" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>
    ),
  },
  {
    nome: 'Retrato',
    ativo: true,
    custom: false,
    iconClass: 'icone-retrato',
    icone: (
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
        <path d="M1 21C1 16.5817 4.58172 13 9 13C13.4183 13 17 16.5817 17 21" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    nome: 'Estudo',
    ativo: true,
    custom: true,
    iconClass: 'icone-estudo',
    corLabel: 'verde',
    icone: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3H10V17H3V3Z" stroke="rgba(51,199,120,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 3H17V17H10V3Z" stroke="rgba(51,199,120,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="5" y1="7" x2="8" y2="7" stroke="rgba(51,199,120,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="10" x2="8" y2="10" stroke="rgba(51,199,120,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="7" x2="15" y2="7" stroke="rgba(51,199,120,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="10" x2="15" y2="10" stroke="rgba(51,199,120,0.7)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    nome: 'IA',
    ativo: true,
    custom: true,
    iconClass: 'icone-ia',
    corLabel: 'azul',
    icone: <span className={styles['estrela-ia']}>✦</span>,
  },
  {
    nome: 'Comida',
    ativo: false,
    custom: false,
    iconClass: 'icone-comida',
    icone: (
      <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 1V7C3 9.209 4.791 11 7 11V19" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 1V11" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 1C11 1 15 4 15 8C15 10.5 13.5 11.5 11 12V19" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nome: 'Intervalo',
    ativo: false,
    custom: false,
    iconClass: 'icone-intervalo',
    icone: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="11" r="7" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
        <path d="M10 8V11L12 13" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 2H13" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 2V4" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    nome: 'Instantâneo',
    ativo: false,
    custom: false,
    iconClass: 'icone-instantaneo',
    icone: (
      <svg width="16" height="22" viewBox="0 0 16 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 1L1 13H8L7 21L15 9H8L9 1Z" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nome: 'Astro',
    ativo: false,
    custom: false,
    iconClass: 'icone-astro',
    icone: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
        <circle cx="11" cy="11" r="3" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" />
        <circle cx="4" cy="4" r="1" fill="rgba(255,255,255,0.5)" />
        <circle cx="18" cy="5" r="1" fill="rgba(255,255,255,0.5)" />
        <circle cx="6" cy="18" r="1" fill="rgba(255,255,255,0.5)" />
      </svg>
    ),
  },
  {
    nome: 'Visualização Dupla',
    ativo: false,
    custom: false,
    iconClass: 'icone-dupl',
    icone: (
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="9" height="14" rx="1.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
        <rect x="12" y="1" width="9" height="14" rx="1.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    nome: 'Documento em Ultra HD',
    ativo: false,
    custom: false,
    iconClass: 'icone-doc',
    icone: (
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 2C1 1.44772 1.44772 1 2 1H10L15 6V18C15 18.5523 14.5523 19 14 19H2C1.44772 19 1 18.5523 1 18V2Z" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
        <path d="M10 1V6H15" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="4" y1="10" x2="12" y2="10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="4" y1="13" x2="12" y2="13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const ICONE_MODO_CUSTOM: ReactNode = <span className={styles['estrela-ia']}>✦</span>;

const ABAS_INFERIORES = ['estudo', 'ia', 'noite', 'mais'] as const;
const LABEL_ABA: Record<(typeof ABAS_INFERIORES)[number], string> = {
  estudo: 'Estudo',
  ia: 'IA',
  noite: 'Noite',
  mais: 'Mais',
};

export function ConfigScreen({ onVoltar }: { onVoltar: () => void }) {
  const [modos, setModos] = useState<ModoItem[]>(MODOS_INICIAIS);
  const [editando, setEditando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<(typeof ABAS_INFERIORES)[number]>('mais');

  function alternarModo(nome: string) {
    const item = modos.find((m) => m.nome === nome);
    if (!item) return;

    if (item.ativo) {
      if (!window.confirm(`Remover o modo "${nome}" da câmera?`)) return;

      if (item.custom && nome !== 'IA' && nome !== 'Estudo') {
        setModos((atual) => atual.filter((m) => m.nome !== nome));
        window.alert(`Modo "${nome}" excluído permanentemente.`);
      } else {
        setModos((atual) => atual.map((m) => (m.nome === nome ? { ...m, ativo: false } : m)));
        window.alert(`Modo "${nome}" movido para Outros Modos.`);
      }
    } else {
      setModos((atual) => atual.map((m) => (m.nome === nome ? { ...m, ativo: true } : m)));
      window.alert(`Modo "${nome}" adicionado à câmera.`);
    }
  }

  function alternarEdicao() {
    if (editando) {
      setEditando(false);
      return;
    }

    const nome = window.prompt('Nome do novo modo customizado:');
    if (nome === null) return;

    const nomeTratado = nome.trim();
    if (nomeTratado.length < 2) {
      window.alert('Nome muito curto. O modo não foi criado.');
      return;
    }

    const jaExiste = modos.some((m) => m.nome.toLowerCase() === nomeTratado.toLowerCase());
    if (jaExiste) {
      window.alert(`Já existe um modo chamado "${nomeTratado}".`);
      return;
    }

    setModos((atual) => [
      ...atual,
      {
        nome: nomeTratado,
        ativo: true,
        custom: true,
        iconClass: 'icone-ia',
        corLabel: 'azul',
        icone: ICONE_MODO_CUSTOM,
      },
    ]);
    window.alert(`Modo "${nomeTratado}" criado!`);
  }

  const ativos = modos.filter((m) => m.ativo);
  const inativos = modos.filter((m) => !m.ativo);

  return (
    <div className={styles.screen}>
      <header className={styles['status-bar']}>
        <span className={styles.time}>9:41</span>
        <div className={styles['status-icons']}>
          <span>▲▲▲</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </header>

      <header className={styles['header-pagina']}>
        <h1 className={styles['titulo-pagina']}>Modos</h1>
        <div className={styles['acoes-header']}>
          <button className={styles['btn-editar']} onClick={alternarEdicao}>
            {editando ? 'Concluído' : 'Editar'}
          </button>
          <button className={styles['btn-voltar']} onClick={onVoltar}>
            Voltar
          </button>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles['grade-modos']}>
          {ativos.map((item) => (
            <article
              key={item.nome}
              className={`${styles['item-modo']} ${item.custom ? styles['item-custom'] : ''}`}
            >
              <button
                className={`${styles.badge} ${styles['badge-remover']}`}
                aria-label="Remover"
                onClick={() => alternarModo(item.nome)}
              >
                ✕
              </button>
              <div className={`${styles['icone-modo']} ${styles[item.iconClass]}`}>{item.icone}</div>
              <p
                className={`${styles['label-modo']} ${
                  item.corLabel ? styles[`label-${item.corLabel}`] : ''
                }`}
              >
                {item.nome}
              </p>
            </article>
          ))}

          <div className={styles['divisor-secao']}>Outros Modos</div>

          {inativos.map((item) => (
            <article key={item.nome} className={styles['item-modo']}>
              <button
                className={`${styles.badge} ${styles['badge-adicionar']}`}
                aria-label="Adicionar"
                onClick={() => alternarModo(item.nome)}
              >
                +
              </button>
              <div className={`${styles['icone-modo']} ${styles[item.iconClass]}`}>{item.icone}</div>
              <p className={styles['label-modo']}>{item.nome}</p>
            </article>
          ))}
        </div>
      </section>

      <nav className={styles['mode-tabs']}>
        {ABAS_INFERIORES.map((aba) => (
          <button
            key={aba}
            className={`${styles['mode-tab']} ${abaAtiva === aba ? styles['mode-tab-ativo'] : ''}`}
            onClick={() => setAbaAtiva(aba)}
          >
            {LABEL_ABA[aba]}
            {aba === 'mais' && <span className={styles['tab-dot']} />}
          </button>
        ))}
      </nav>
    </div>
  );
}
