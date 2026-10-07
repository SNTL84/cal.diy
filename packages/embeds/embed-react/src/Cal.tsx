"use client";

import { useEffect, useRef } from "react";

import type { PrefillAndIframeAttrsConfig, UiConfig } from "@calcom/embed-core";

import useEmbed from "./useEmbed";

type CalProps = {
  calOrigin?: string;
  calLink: string;
  initConfig?: {
    debug?: boolean;
    uiDebug?: boolean;
  };
  namespace?: string;
  config?: PrefillAndIframeAttrsConfig;
  embedJsUrl?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const getUiConfig = (config?: PrefillAndIframeAttrsConfig): UiConfig => {
  if (!config) {
    return {};
  }

  return {
    ...(config.theme !== undefined ? { theme: config.theme } : {}),
    ...(config.layout !== undefined ? { layout: config.layout } : {}),
    ...(config.styles !== undefined ? { styles: config.styles } : {}),
    ...(config.cssVarsPerTheme !== undefined ? { cssVarsPerTheme: config.cssVarsPerTheme } : {}),
    ...(config.colorScheme !== undefined ? { colorScheme: config.colorScheme } : {}),
    ...(config.disableAutoScroll !== undefined
      ? { disableAutoScroll: config.disableAutoScroll }
      : config["ui.autoscroll"] !== undefined
        ? { disableAutoScroll: config["ui.autoscroll"] === "false" }
        : {}),
    ...(config.useSlotsViewOnSmallScreen !== undefined
      ? { useSlotsViewOnSmallScreen: config.useSlotsViewOnSmallScreen === "true" }
      : {}),
  };
};

const Cal = function Cal(props: CalProps) {
  const { calLink, calOrigin, namespace = "", config, initConfig = {}, embedJsUrl, ...restProps } = props;
  if (!calLink) {
    throw new Error("calLink is required");
  }
  const initializedRef = useRef(false);
  const initializedNamespaceRef = useRef<string | null>(null);
  const Cal = useEmbed(embedJsUrl);
  const ref = useRef<HTMLDivElement>(null);

  // Keep initialization one-shot for React Strict Mode; config updates are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!Cal || initializedRef.current || !ref.current) {
      return;
    }

    initializedRef.current = true;
    initializedNamespaceRef.current = namespace || null;

    const element = ref.current;
    if (namespace) {
      Cal("init", namespace, {
        ...initConfig,
        origin: calOrigin,
      });
      Cal.ns[namespace]("inline", {
        elementOrSelector: element,
        calLink,
        config,
      });
    } else {
      Cal("init", {
        ...initConfig,
        origin: calOrigin,
      });
      Cal("inline", {
        elementOrSelector: element,
        calLink,
        config,
      });
    }
  }, [Cal, namespace, calOrigin, initConfig]);

  useEffect(() => {
    if (!Cal || !initializedRef.current) {
      return;
    }

    const uiConfig = getUiConfig(config);
    const initializedNamespace = initializedNamespaceRef.current;

    if (initializedNamespace) {
      Cal.ns[initializedNamespace]("ui", uiConfig);
    } else {
      Cal("ui", uiConfig);
    }
  }, [Cal, config]);

  if (!Cal) {
    return null;
  }

  return <div ref={ref} {...restProps} />;
};

export default Cal;
