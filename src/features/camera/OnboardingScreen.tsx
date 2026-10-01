import { useEffect, useState } from 'react';
import styles from './OnboardingScreen.module.css';

const SLIDES = [
  {
    titulo: (
      <>
        Bem-vindo ao
        <br />
        JOVI Cam
      </>
    ),
    desc: (
      <>
        Sua câmera agora é inteligente.
        <br />
        Deixa ela fazer o trabalho por você.
      </>
    ),
  },
  {
    titulo: 'Modo IA Auto',
    desc: (
      <>
        A câmera detecta automaticamente o
        <br />
        ambiente e ajusta o modo ideal —{' '}
        <br />
        balada, paisagem, comida e muito.
      </>
    ),
  },
  {
    titulo: 'Modo Estudo',
    desc: (
      <>
        Fotografe anotações ou a lousa e a IA{' '}
        <br />
        organiza tudo direto no seu app de notas.
      </>
    ),
  },
  {
    titulo: 'Navegue pelos modos',
    desc: (
      <>
        Arraste a barra de modos ou toque{' '}
        <br />
        diretamente para trocar. IA Auto é <br />
        sempre o ponto de partida.
      </>
    ),
  },
];

export function OnboardingScreen({ onConcluir }: { onConcluir: () => void }) {
  const [slideAtual, setSlideAtual] = useState(0);
  const ultimo = slideAtual === SLIDES.length - 1;

  function proximo() {
    if (ultimo) {
      onConcluir();
      return;
    }
    setSlideAtual((s) => s + 1);
  }

  function anterior() {
    setSlideAtual((s) => Math.max(0, s - 1));
  }

  function pular() {
    if (window.confirm('Pular o tutorial e ir direto para o app?')) {
      onConcluir();
    }
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') proximo();
      if (e.key === 'ArrowLeft' && slideAtual > 0) anterior();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideAtual, ultimo]);

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

      <section className={styles.viewfinder}>
        <div className={styles.ruido} />
      </section>

      <section className={styles['area-card']}>
        <article className={styles.card}>
          <div className={styles.indicadores}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === slideAtual ? styles['dot-ativo'] : ''}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlideAtual(i)}
              />
            ))}
          </div>

          <div className={styles['circulo-icone']}>
            <span className={styles.estrela}>✦</span>
          </div>

          <div className={styles.slides}>
            <div className={styles['slide-ativo']}>
              <h1 className={styles['titulo-card']}>{SLIDES[slideAtual].titulo}</h1>
              <p className={styles['desc-card']}>{SLIDES[slideAtual].desc}</p>
            </div>
          </div>

          <button className={styles['btn-proximo']} onClick={proximo}>
            {ultimo ? 'Entendi' : 'Próximo'}
          </button>
          <div className={styles['linha-navegacao']}>
            <button className={styles['btn-anterior']} onClick={anterior} disabled={slideAtual === 0}>
              Anterior
            </button>
            <button className={styles['btn-pular']} onClick={pular}>
              Pular tutorial
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
