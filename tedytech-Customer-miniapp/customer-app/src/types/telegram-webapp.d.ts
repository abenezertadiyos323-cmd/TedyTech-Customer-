export {};

declare global {
  interface TelegramWebAppThemeParams {
    bg_color?: string;
    text_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  }

  interface TelegramWebAppMainButton {
    setText?: (text: string) => void;
    show?: () => void;
    hide?: () => void;
    onClick?: (handler: () => void) => void;
    offClick?: (handler: () => void) => void;
  }

  interface TelegramWebApp {
    initData?: string;
    initDataUnsafe?: {
      user?: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        language_code?: string;
      };
    };
    themeParams?: TelegramWebAppThemeParams;
    ready?: () => void;
    expand?: () => void;
    close?: () => void;
    MainButton?: TelegramWebAppMainButton;
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
