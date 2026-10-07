export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** id of the entity that was created/updated */
  id?: string;
}

export const IDLE_STATE: ActionState = {};
