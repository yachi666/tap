import { BracketsCurly } from '@phosphor-icons/react';
import type { EndpointDetail, SchemaDisplayNode } from '../../../types';
import { SchemaViewer } from '../SchemaViewer';

interface SchemaTabProps {
  responseSchema?: EndpointDetail['responses'][number];
  requestSchema?: { schemaRef?: string };
  schemas: Record<string, SchemaDisplayNode>;
}

/**
 * Displays the request and response schemas side-by-side in details/summary blocks.
 * Resolves schemaRefs through the provided schema registry.
 */
export function SchemaTab({ responseSchema, requestSchema, schemas }: SchemaTabProps) {
  const resSchema = responseSchema?.schemaRef ? schemas[responseSchema.schemaRef] : undefined;
  const reqSchema = requestSchema?.schemaRef ? schemas[requestSchema.schemaRef] : undefined;

  return (
    <div className="schema-tab">
      {reqSchema ? (
        <details open className="schema-details">
          <summary>
            <BracketsCurly size={16} />
            请求 Schema — {reqSchema.displayName}
          </summary>
          <SchemaViewer schema={reqSchema} initialDepth={3} />
        </details>
      ) : (
        <div className="empty-state">无请求 Schema。</div>
      )}
      {resSchema ? (
        <details open className="schema-details">
          <summary>
            <BracketsCurly size={16} />
            响应 Schema — {resSchema.displayName}
          </summary>
          <SchemaViewer schema={resSchema} initialDepth={3} />
        </details>
      ) : (
        <div className="empty-state">无响应 Schema。</div>
      )}
    </div>
  );
}
