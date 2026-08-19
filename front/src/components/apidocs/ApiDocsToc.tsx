import type { EndpointDef } from './types';

interface TocProps {
  endpoint: EndpointDef | null;
}

export function ApiDocsToc({ endpoint }: TocProps) {
  if (!endpoint) {
    return (
      <div className="apidocs-toc">
        <div className="apidocs-toc-title">On this page</div>
        <ul>
          <li><a href="#authentication">Authentication</a></li>
        </ul>
      </div>
    );
  }

  return (
    <div className="apidocs-toc">
      <div className="apidocs-toc-title">On this page</div>
      <ul>
        <li><a href="#overview">{endpoint.method} {endpoint.path}</a></li>
        {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
          <li><a href="#parameters">Parameters</a></li>
        )}
        <li><a href="#responses">Responses</a></li>
        <li><a href="#example">Example</a></li>
      </ul>
    </div>
  );
}
