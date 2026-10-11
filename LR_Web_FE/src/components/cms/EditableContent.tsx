import React, { createContext, useContext, useState, useEffect } from "react";
import { apiUrl } from "../../api/client";

export interface EditableContextType {
  content: Record<string, unknown>;
  getNestedValue: (path: string) => unknown;
  updateField: (path: string, value: unknown) => void;
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  saveChanges: () => Promise<boolean>;
  isSaving: boolean;
}

const EditableContext = createContext<EditableContextType>({
  content: {},
  getNestedValue: () => undefined,
  updateField: () => {},
  isEditMode: false,
  setEditMode: () => {},
  saveChanges: async () => false,
  isSaving: false,
});

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null || typeof curr !== "object") {
      return undefined;
    }
    curr = (curr as Record<string, unknown>)[part];
  }
  return curr;
}

function setByPath(obj: Record<string, unknown>, path: string, val: unknown): Record<string, unknown> {
  const parts = path.split(".");
  const root = { ...obj };
  let curr: Record<string, unknown> = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof curr[part] !== "object" || curr[part] === null) {
      curr[part] = {};
    } else {
      curr[part] = { ...(curr[part] as Record<string, unknown>) };
    }
    curr = curr[part] as Record<string, unknown>;
  }

  curr[parts[parts.length - 1]] = val;
  return root;
}

interface EditableProviderProps {
  children: React.ReactNode;
  initialContent?: Record<string, unknown>;
  pageKey?: string;
}

export const EditableProvider: React.FC<EditableProviderProps> = ({
  children,
  initialContent = {},
  pageKey = "global",
}) => {
  const [content, setContent] = useState<Record<string, unknown>>(initialContent);
  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load any stored content from API if available
  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl(`content.php?page=${encodeURIComponent(pageKey)}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data === "object") {
          setContent((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        // Fallback gracefully to bundled initialContent
      });
    return () => {
      isMounted = false;
    };
  }, [pageKey]);

  const getNestedValue = (path: string): unknown => {
    return getByPath(content, path);
  };

  const updateField = (path: string, value: unknown) => {
    setContent((prev) => setByPath(prev, path, value));
  };

  const saveChanges = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch(apiUrl("content.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pageKey, content }),
      });
      setIsSaving(false);
      return res.ok;
    } catch {
      setIsSaving(false);
      return false;
    }
  };

  return (
    <EditableContext.Provider
      value={{
        content,
        getNestedValue,
        updateField,
        isEditMode,
        setEditMode,
        saveChanges,
        isSaving,
      }}
    >
      {children}
    </EditableContext.Provider>
  );
};

export function useEditable(path: string, fallback = ""): string {
  const { getNestedValue } = useContext(EditableContext);
  const val = getNestedValue(path);
  return typeof val === "string" && val.trim() !== "" ? val : fallback;
}

export interface EditableTextProps extends React.HTMLAttributes<HTMLElement> {
  path: string;
  fallback?: string;
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

export const EditableText: React.FC<EditableTextProps> = ({
  path,
  fallback = "",
  as = "span",
  className = "",
  children,
  ...props
}) => {
  const { getNestedValue, isEditMode, updateField } = useContext(EditableContext);
  const Component = as;
  const initialValue = fallback || (typeof children === "string" ? children : "");
  const val = getNestedValue(path);
  const text = typeof val === "string" && val.trim() !== "" ? val : initialValue;

  if (isEditMode) {
    return (
      <Component
        contentEditable
        suppressContentEditableWarning
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          updateField(path, e.currentTarget.innerText);
        }}
        className={`${className} outline-1 outline-dashed outline-amber-400 bg-amber-50/20 px-1 rounded cursor-text`}
        {...props}
      >
        {text}
      </Component>
    );
  }

  return (
    <Component className={className} {...props}>
      {text}
    </Component>
  );
};
