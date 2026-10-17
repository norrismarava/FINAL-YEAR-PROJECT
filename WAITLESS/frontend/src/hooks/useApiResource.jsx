import { useCallback, useEffect, useRef, useState } from "react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";

export function useApiResource(loader, { enabled = true } = {}) {
  const { refreshToken } = useLiveRefresh();
  const [state, setState] = useState({
    data: null,
    error: null,
    isError: false,
    isLoading: Boolean(enabled),
  });

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({
        ...current,
        error: null,
        isError: false,
        isLoading: false,
      }));
      return undefined;
    }

    let cancelled = false;

    // Silent refresh: when data already exists, keep it on screen and
    // update in the background instead of flipping back to the loader.
    setState((current) => ({
      ...current,
      error: null,
      isError: false,
      isLoading: !current.data,
    }));

    loader()
      .then((data) => {
        if (!cancelled) {
          setState({ data, error: null, isError: false, isLoading: false });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ data: null, error, isError: true, isLoading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, loader, refreshToken]);

  return state;
}

export function useApiAction(action, { onSuccess } = {}) {
  const actionRef = useRef(action);
  const onSuccessRef = useRef(onSuccess);
  const [state, setState] = useState({
    data: null,
    error: null,
    isError: false,
    isPending: false,
    variables: null,
  });

  actionRef.current = action;
  onSuccessRef.current = onSuccess;

  const mutate = useCallback((variables) => {
    setState((current) => ({
      ...current,
      error: null,
      isError: false,
      isPending: true,
      variables,
    }));

    actionRef
      .current(variables)
      .then((data) => {
        setState({
          data,
          error: null,
          isError: false,
          isPending: false,
          variables,
        });
        onSuccessRef.current?.(data, variables);
      })
      .catch((error) => {
        setState({
          data: null,
          error,
          isError: true,
          isPending: false,
          variables,
        });
      });
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isError: false,
      isPending: false,
      variables: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
