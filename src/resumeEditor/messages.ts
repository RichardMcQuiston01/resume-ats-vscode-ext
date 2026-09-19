import type { ResumeData } from '../resume/types';

export interface LoadMessage {
  type: 'load';
  resume: ResumeData;
}

export interface SavedMessage {
  type: 'saved';
}

export interface SaveErrorMessage {
  type: 'saveError';
  errors: string[];
}

export type ExtensionToWebviewMessage = LoadMessage | SavedMessage | SaveErrorMessage;

export interface SaveRequestMessage {
  type: 'saveRequest';
  resume: ResumeData;
}

export type WebviewToExtensionMessage = SaveRequestMessage;
