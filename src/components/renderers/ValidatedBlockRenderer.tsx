'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

type LandingPageComponentProps = Record<string, unknown>;
type LandingPageComponent = ComponentType<LandingPageComponentProps>;
type LandingPageComponentModule = Record<string, LandingPageComponent | undefined> & {
  default?: LandingPageComponent;
};

const componentCache = new Map<string, LandingPageComponent>();

interface BlockRendererProps {
  type: string;
  subtype: string;
  content: LandingPageComponentProps;
  blockId?: string;
  isEditMode?: boolean;
  onUpdate?: (path: string, value: unknown) => void;
}

async function loadComponent(subtype: string): Promise<LandingPageComponent> {
  if (componentCache.has(subtype)) {
    return componentCache.get(subtype)!;
  }

  try {
    const componentModule: LandingPageComponentModule = await import(
      /* webpackChunkName: "landing-page-[request]" */ `../landing-page/${subtype}`
    );
    const Component = componentModule[subtype] ?? componentModule.default;

    if (!Component) {
      throw new Error(`Component ${subtype} not exported from ../landing-page/${subtype}`);
    }

    componentCache.set(subtype, Component);
    return Component;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Unable to dynamically import component ${subtype}`);
  }
}

export default function ValidatedBlockRenderer({
  subtype,
  content,
  blockId,
  isEditMode = false,
  onUpdate,
}: BlockRendererProps) {
  const [Component, setComponent] = useState<LandingPageComponent | null>(componentCache.get(subtype) ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Component ? false : true);

  useEffect(() => {
    let isMounted = true;

    if (!subtype) {
      setComponent(null);
      setLoadError('Component subtype missing');
      setIsLoading(false);
      return;
    }

    const cached = componentCache.get(subtype);
    if (cached) {
      setComponent(() => cached);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setComponent(null);

    loadComponent(subtype)
      .then((loadedComponent) => {
        if (!isMounted) return;
        setComponent(() => loadedComponent);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error(`Failed to load component ${subtype}`, error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load component');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [subtype]);

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md animate-pulse">
        <p className="text-gray-500">Loading component {subtype}...</p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-600">Component {subtype} not found</p>
        {loadError ? (
          <p className="text-red-500 text-sm mt-2">{loadError}</p>
        ) : null}
      </div>
    );
  }

  // 传递编辑相关的属性到组件，包括basePath
  return <Component {...content} isEditMode={isEditMode} onUpdate={onUpdate} basePath={blockId} />;
}
