// Common type definitions

export interface Profile {
  id: string;
  role: string;
  email?: string;
  full_name?: string;
  [key: string]: unknown;
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  description?: string;
  [key: string]: unknown;
}

export interface FormEvent extends React.FormEvent<HTMLFormElement> {
  target: EventTarget & HTMLFormElement;
}

export interface ChangeEvent extends React.ChangeEvent<HTMLInputElement> {
  target: EventTarget & HTMLInputElement;
}
