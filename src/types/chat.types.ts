export interface ChatRequestBody {
  message: string;
  conversationId?: string | null;
  botId?: string;
  webSearch?: boolean;
}

export interface ChatSourceItem {
  title: string;
  url: string;
  domain: string;
}

export interface ChatStreamTokenEvent {
  type: "token";
  content: string;
}

export interface ChatStreamRoutingEvent {
  type: "routing";
  botId: string;
  botName: string;
  category?: string;
  confidence?: number;
  tools?: string[];
  reason?: string;
}

export interface ChatStreamStatusEvent {
  type: "status";
  message: string;
}

export interface ChatStreamSourcesEvent {
  type: "sources";
  sources: ChatSourceItem[];
}

export interface ChatStreamMetricsEvent {
  type: "metrics";
  metrics: {
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    architecture: string;
    provider: string;
    dimensions?: number;
  };
}

export interface ChatStreamCompleteEvent {
  type: "complete";
  conversationId: string;
  messageId: string;
}
