import { BentoGrid } from '../components/ui/bento-grid.tsx';

export default function BentoDemoPage() {
  return (
    <div style={{ padding: '4rem 1rem', flex: 1, position: 'relative', zIndex: 10 }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Bento Grid Demo
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          A Vanilla CSS translation of the Tailwind component, deeply integrated with the FluxionAI theme.
        </p>
      </div>

      <BentoGrid />
    </div>
  );
}
