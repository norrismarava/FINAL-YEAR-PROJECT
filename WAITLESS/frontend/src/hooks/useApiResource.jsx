import { useCallback, useEffect, useRef, useState } from "react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";

export function useApiResource(loader, { enabled = true } = {}) {
  const { refreshToken } = useLiveRefresh();
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [state, setState] = useState({
    data: null,
    error: null,
    isError: false,
    isLoading: Boolean(enabled),
  });

  // Explicit refetch — also forces a load on `enabled: false` resources
  // (e.g. collapsed sections that fetch on first expand).
  const refetch = useCallback(() => {
    setRefreshNonce((nonce) => nonce + 1);
  }, []);

  useEffect(() => {
    if (!enabled && refreshNonce === 0) {
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
  }, [enabled, loader, refreshToken, refreshNonce]);

  // `loading` alias kept for callers written before `isLoading` existed.
  return { ...state, loading: state.isLoading, refetch };
}

export function useApiAction(action, { onSuccess, onError } = {}) {
  const actionRef = useRef(action);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [state, setState] = useState({
    data: null,
    error: null,
    isError: false,
    isPending: false,
    variables: null,
  });

  actionRef.current = action;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const mutate = useCallback((...args) => {
    const variables = args.length > 1 ? args : args[0];
    setState((current) => ({
      ...current,
      error: null,
      isError: false,
      isPending: true,
      variables,
    }));

    return actionRef
      .current(...args)
      .then((data) => {
        setState({
          data,
          error: null,
          isError: false,
          isPending: false,
          variables,
        });
        onSuccessRef.current?.(data, variables);
        return data;
      })
      .catch((error) => {
        setState({
          data: null,
          error,
          isError: true,
          isPending: false,
          variables,
        });
        onErrorRef.current?.(error, variables);
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
