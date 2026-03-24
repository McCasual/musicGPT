export const PROMPT_COMPLETED_CHANNEL = 'prompt.completed.channel';
export const PROMPT_COMPLETED_EVENT_NAME = 'prompt.completed';

export interface PromptCompletedRealtimeEvent {
  userId: string;
  prompt: {
    id: string;
    text: string;
    status: 'COMPLETED';
    createdAt: string;
    updatedAt: string;
  };
  audio: {
    id: string;
    title: string;
    url: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}