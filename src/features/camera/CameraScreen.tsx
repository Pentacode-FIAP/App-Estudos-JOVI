import { useEffect, useRef, useState } from 'react';
import { type Tab } from '../../components/BottomNav';
import { Toast } from '../../components/Toast';
import { db } from '../../lib/db';
import { runOcr } from '../../lib/gemini';
import { OcrPanel, type EstadoOcr } from './OcrPanel';
import styles from './CameraScreen.module.css';

type Modo = 'ia' | 'estudo' | 'noite' | 'foto' | 'video';

const TEXTOS_CHIP: Record<Modo, string> = {
  ia: 'IA · Modo Noite detectado',
  estudo: 'IA Auto · Texto detectado',
  noite: 'Modo Noite ativo',
  foto: 'Modo Foto',
  video: 'Gravando vídeo',
};

const CTRL_BOTOES: { id: string; label: string }[] = [
  { id: 'hdr', label: '⊙' },
  { id: 'flash', label: '⚡' },
  { id: 'grid', label: '◎' },
  { id: 'filter', label: '◈' },
  { id: 'settings', label: '⚙' },
];

const MODOS_TABS: { id: Modo; label: string; classe?: string; dot?: boolean }[] = [
  { id: 'estudo', label: 'Estudo', classe: styles['mode-tab-estudo'] },
  { id: 'ia', label: 'IA', classe: styles['mode-tab-ia'], dot: true },
  { id: 'noite', label: 'Noite' },
  { id: 'foto', label: 'Foto' },
  { id: 'video', label: 'Vídeo' },
];

const ZOOMS = ['0.6', '1', '2'] as const;

export function CameraScreen({
  onAbrirConfig,
  onAbrirEstudos,
}: {
  onAbrirConfig: () => void;
  onAbrirEstudos: (aba: Tab) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modo, setModo] = useState<Modo>('ia');
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>('1');
  const [ctrlAtivos, setCtrlAtivos] = useState<Set<string>>(new Set(['grid']));
  const [fotosTiradas, setFotosTiradas] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [cameraFrontal, setCameraFrontal] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [semCamera, setSemCamera] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'erro' | 'sucesso'; mensagem: string } | null>(null);
  const [ocr, setOcr] = useState<EstadoOcr | null>(null);
  const ocrReqRef = useRef(0);

  useEffect(() => {
    let cancelado = false;

    async function iniciarCamera() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setSemCamera(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFrontal ? 'user' : 'environment' },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setSemCamera(false);
      } catch (err) {
        setSemCamera(true);
        console.warn('Câmera indisponível:', err);
      }
    }

    iniciarCamera();

    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraFrontal]);

  function alternarCtrl(id: string) {
    if (id === 'settings') {
      onAbrirConfig();
      return;
    }
    setCtrlAtivos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function capturarFrame(): Promise<Blob | null> {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || semCamera || video.readyState < 2) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }

  async function tirarFoto() {
    setFlashKey((k) => k + 1);
    setFotosTiradas((n) => n + 1);

    if (modo !== 'estudo') return;

    const blob = await capturarFrame();
    if (!blob) return;

    try {
      await db.fotos.add({ blob, dataUpload: new Date().toISOString() });
      setToast({ tipo: 'sucesso', mensagem: 'Foto salva na galeria' });
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar foto, tente novamente.' });
    }
  }

  function fecharOcr() {
    ocrReqRef.current += 1;
    setOcr(null);
  }

  function trocarModo(novo: Modo) {
    if (novo !== modo) fecharOcr();
    setModo(novo);
  }

  async function copiarTexto() {
    const req = ocrReqRef.current + 1;
    ocrReqRef.current = req;
    setOcr({ estado: 'lendo' });

    const blob = await capturarFrame();
    if (ocrReqRef.current !== req) return;

    if (!blob) {
      setOcr(null);
      setToast({ tipo: 'erro', mensagem: 'Câmera indisponível' });
      return;
    }

    try {
      const texto = await runOcr(blob);
      if (ocrReqRef.current !== req) return;
      if (!texto.trim()) {
        setOcr({ estado: 'erro', mensagem: 'Nenhum texto encontrado na imagem.' });
      } else {
        setOcr({ estado: 'pronto', texto: texto.trim() });
      }
    } catch {
      if (ocrReqRef.current !== req) return;
      setOcr({ estado: 'erro', mensagem: 'Não consegui ler o texto. Tente de novo.' });
    }
  }

  function alternarCamera() {
    setFlipping(true);
    setTimeout(() => setFlipping(false), 300);
    setCameraFrontal((f) => !f);
  }

  function abrirGaleriaFake() {
    if (fotosTiradas === 0) {
      window.alert('Você ainda não tirou nenhuma foto.');
      return;
    }
    window.alert(
      `Galeria · ${fotosTiradas} ${fotosTiradas === 1 ? 'foto disponível' : 'fotos disponíveis'}.`,
    );
  }

  const classeModo = modo === 'estudo' ? 'estudo' : 'ia';

  return (
    <div
      className={[
        styles.screen,
        styles.camera,
        styles[`camera-${classeModo}`],
        semCamera ? styles['no-camera'] : '',
      ].join(' ')}
    >
      <header className={styles['status-bar']}>
        <span className={styles.time}>9:41</span>
        <div className={styles['status-icons']}>
          <span>▲▲▲</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </header>

      <nav className={styles['barra-topo']}>
        {CTRL_BOTOES.map((btn) => (
          <button
            key={btn.id}
            className={`${styles['ctrl-btn']} ${ctrlAtivos.has(btn.id) ? styles['ctrl-btn-ativo'] : ''}`}
            onClick={() => alternarCtrl(btn.id)}
          >
            {btn.label}
          </button>
        ))}
      </nav>

      <section className={styles.viewfinder}>
        <video ref={videoRef} className={styles['video-cam']} autoPlay muted playsInline />
        <div className={styles['fallback-cam']} />

        <div className={styles['chip-ia']}>
          <span className={styles['chip-dot']} />
          <span className={styles['chip-label']}>{TEXTOS_CHIP[modo]}</span>
        </div>

        <div className={`${styles['grid-overlay']} ${ctrlAtivos.has('grid') ? '' : styles.hidden}`}>
          <div className={`${styles['linha-grid']} ${styles['grid-v1']}`} />
          <div className={`${styles['linha-grid']} ${styles['grid-v2']}`} />
          <div className={`${styles['linha-grid']} ${styles['grid-h1']}`} />
          <div className={`${styles['linha-grid']} ${styles['grid-h2']}`} />
        </div>

        <div className={styles.foco}>
          <span className={`${styles.canto} ${styles['canto-tl']}`} />
          <span className={`${styles.canto} ${styles['canto-tr']}`} />
          <span className={`${styles.canto} ${styles['canto-bl']}`} />
          <span className={`${styles.canto} ${styles['canto-br']}`} />
        </div>

        <div className={styles['linha-scan']} />

        <div className={styles['contador-fotos']}>
          {fotosTiradas} {fotosTiradas === 1 ? 'foto' : 'fotos'}
        </div>

        {ocr && <OcrPanel estado={ocr} onFechar={fecharOcr} />}

        <div
          key={flashKey}
          className={`${styles['overlay-flash']} ${flashKey > 0 ? styles['flash-ativo'] : ''}`}
        />
      </section>

      <div className={styles['zoom-bar']}>
        {ZOOMS.map((z) => (
          <button
            key={z}
            className={`${styles['zoom-option']} ${zoom === z ? styles['zoom-option-ativo'] : ''}`}
            onClick={() => setZoom(z)}
          >
            {z === '1' ? '1×' : z === '2' ? '2×' : '0.6x'}
          </button>
        ))}
      </div>

      <nav className={styles['mode-tabs']}>
        {MODOS_TABS.map((tab) => (
          <button
            key={tab.id}
            className={[
              styles['mode-tab'],
              tab.classe ?? '',
              modo === tab.id ? styles['mode-tab-ativo'] : '',
            ].join(' ')}
            onClick={() => trocarModo(tab.id)}
          >
            {tab.label}
            {tab.dot && <span className={styles['tab-dot']} />}
          </button>
        ))}
        <button className={styles['mode-tab']} onClick={onAbrirConfig}>
          Modos
        </button>
      </nav>

      {modo === 'estudo' && (
        <section className={styles['action-row']}>
          <button
            className={styles['btn-action']}
            onClick={copiarTexto}
            disabled={ocr?.estado === 'lendo'}
          >
            {ocr?.estado === 'lendo' ? 'Lendo...' : 'Copiar texto'}
          </button>
          <button className={styles['btn-action']} onClick={() => onAbrirEstudos('galeria')}>
            Abrir app de estudos
          </button>
        </section>
      )}


      <footer className={styles['controles-camera']}>
        <button className={styles['btn-gallery']} onClick={abrirGaleriaFake}>
          📷
        </button>
        <button className={styles['btn-shutter']} onClick={tirarFoto} />
        <button
          className={`${styles['btn-flip']} ${flipping ? styles.flipping : ''}`}
          onClick={alternarCamera}
        >
          ⟳
        </button>
      </footer>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {toast && (
        <Toast message={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
