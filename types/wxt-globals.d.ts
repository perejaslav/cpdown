declare const chrome: any;

declare namespace chrome {
  namespace tabs {
    interface CreateProperties {
      url?: string;
      active?: boolean;
    }

    interface UpdateProperties {
      muted?: boolean;
    }

    interface Tab {
      id?: number;
      url?: string;
    }
  }
}

declare function defineBackground(main: () => void): unknown;
declare function defineContentScript(config: {
  matches: string[];
  runAt?: string;
  world?: string;
  main: () => void;
}): unknown;
