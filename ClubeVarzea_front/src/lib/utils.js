import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 

export const isIframe = window.self !== window.top;

// Gerar ID anônimo para usuários não logados
export const generateAnonymousId = () => {
  return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Obter ou criar ID anônimo
export const getOrCreateAnonymousId = () => {
  const key = 'clubevarzea_anon_id';
  let anonId = localStorage.getItem(key);
  if (!anonId) {
    anonId = generateAnonymousId();
    localStorage.setItem(key, anonId);
  }
  return anonId;
};
