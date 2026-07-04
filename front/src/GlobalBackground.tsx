
import { Floating3DBackground } from './components/FloatingShape';
import './GlobalBackground.css';

export function GlobalBackground() {
  return (
    <div className="global-background-container">
      {/* 2D Colorful animated blobs */}
      <div className="global-bg-shapes">
        <div className="global-shape global-shape--1" />
        <div className="global-shape global-shape--2" />
        <div className="global-shape global-shape--3" />
        <div className="global-shape global-shape--4" />
        <div className="global-shape global-shape--5" />
      </div>
      
      {/* 3D Shapes */}
      <Floating3DBackground />
    </div>
  );
}
