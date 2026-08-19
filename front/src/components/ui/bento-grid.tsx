import React from "react";
import "./BentoGrid.css";
import { FiTrendingUp, FiCheckCircle, FiVideo, FiGlobe } from "react-icons/fi";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  onClick?: () => void;
}

interface BentoGridProps {
  items?: BentoItem[];
}

const itemsSample: BentoItem[] = [
  {
    title: "Analytics Dashboard",
    meta: "v2.4.1",
    description: "Real-time metrics with AI-powered insights and predictive analytics",
    icon: <FiTrendingUp size={16} />,
    status: "Live",
    tags: ["Statistics", "Reports", "AI"],
    colSpan: 2,
    hasPersistentHover: true,
  },
  {
    title: "Task Manager",
    meta: "84 completed",
    description: "Automated workflow management with priority scheduling",
    icon: <FiCheckCircle size={16} />,
    status: "Updated",
    tags: ["Productivity", "Automation"],
  },
  {
    title: "Media Library",
    meta: "12GB used",
    description: "Cloud storage with intelligent content processing",
    icon: <FiVideo size={16} />,
    tags: ["Storage", "CDN"],
    colSpan: 2,
  },
  {
    title: "Global Network",
    meta: "6 regions",
    description: "Multi-region deployment with edge computing",
    icon: <FiGlobe size={16} />,
    status: "Beta",
    tags: ["Infrastructure", "Edge"],
  },
];

export function BentoGrid({ items = itemsSample }: BentoGridProps) {
  return (
    <div className="bento-grid">
      {items.map((item, index) => {
        const colClass = item.colSpan === 2 ? "col-span-2" : "";
        const hoverClass = item.hasPersistentHover ? "persistent-hover" : "";
        
        return (
          <div 
            key={index} 
            className={`bento-item ${colClass} ${hoverClass} ${item.onClick ? 'clickable' : ''}`}
            onClick={item.onClick}
            style={{ cursor: item.onClick ? 'pointer' : 'default' }}
          >
            
            {/* Background layers */}
            <div className="bento-gradient-layer" />
            <div className="bento-item-dots-bg" />

            <div className="bento-content">
              {/* Top: Icon + Status */}
              <div className="bento-header">
                <div className="bento-icon">{item.icon}</div>
                <span className="bento-status">{item.status || "Active"}</span>
              </div>

              {/* Middle: Title, Meta, Desc */}
              <div className="bento-text-area">
                <h3 className="bento-title">
                  {item.title}
                  {item.meta && <span className="bento-meta">{item.meta}</span>}
                </h3>
                <p className="bento-description">{item.description}</p>
              </div>

              {/* Bottom: Tags + CTA */}
              <div className="bento-footer">
                <div className="bento-tags">
                  {item.tags?.map((tag, i) => (
                    <span key={i} className="bento-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="bento-cta">{item.cta || "Explore →"}</span>
              </div>
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
