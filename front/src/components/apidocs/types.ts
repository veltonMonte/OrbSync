export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ParamDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  enumValues?: string[];
}

export interface EndpointResponse {
  status: number;
  label: string;
  description: string;
  example: any;
}

export interface SnippetDef {
  curl: string;
  js: string | {
    fetch: string;
    axios: string;
    express: string;
    nestjs: string;
  };
  ts: string;
  java: string | {
    httpClient: string;
    springBoot: string;
  };
  python: string;
  php: string;
}

export interface EndpointDef {
  id: string;
  category: string;
  title: string;
  method: HttpMethod;
  path: string;
  permission: string;
  permissionDesc: string;
  description: string;
  bodyParams?: ParamDef[];
  queryParams?: ParamDef[];
  responses: EndpointResponse[];
  snippet: SnippetDef;
}
