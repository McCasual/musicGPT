export type PromptSubscriptionStatus = 'FREE' | 'PAID';

export const PROMPT_SCHEDULER_QUEUE = 'prompt-scheduler';
export const PROMPT_PROCESSING_QUEUE = 'prompt-processing';
export const SCHEDULE_PENDING_PROMPTS_JOB = 'schedule-pending-prompts';
export const PROCESS_PROMPT_JOB = 'process-prompt';
export const PROMPT_SCHEDULER_JOB_ID = 'prompt-scheduler-cron';

export interface SchedulePendingPromptsJobData {
  batchSize: number;
}

export interface ProcessPromptJobData {
  promptId: string;
}

export interface PromptSchedulingCandidate {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  subscriptionStatus: PromptSubscriptionStatus;
}

export function getPromptJobPriority(
  subscriptionStatus: PromptSubscriptionStatus,
): number {
  return subscriptionStatus === 'PAID' ? 1 : 10;
}
