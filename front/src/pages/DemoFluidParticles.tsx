import { FluidParticlesBackground } from "../components/ui/FluidParticlesBackground";

export default function DemoFluidParticlesBackground() {
  return (
    <FluidParticlesBackground>
      <div style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '4rem', 
          fontWeight: 400, 
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '1rem'
        }}>
          Fluid <span style={{ color: 'var(--accent)' }}>Particles</span>
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Uma demonstração da integração do componente com as variáveis do tema Editorial Técnico do FluxionAI.
        </p>
      </div>
    </FluidParticlesBackground>
  );
}
