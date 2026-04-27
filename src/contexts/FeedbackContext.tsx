import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FeedbackKind = 'loading' | 'processing' | 'success' | 'error';

type FeedbackState = {
  visible: boolean;
  kind: FeedbackKind;
  title: string;
  message?: string;
};

type FeedbackContextValue = {
  showLoading: (title: string, message?: string) => void;
  showProcessing: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string, autoHideMs?: number) => void;
  showError: (title: string, message?: string) => void;
  hideFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FeedbackState>({
    visible: false,
    kind: 'loading',
    title: '',
  });

  const hideFeedback = useCallback(() => {
    setState((current) => ({ ...current, visible: false }));
  }, []);

  const present = useCallback((kind: FeedbackKind, title: string, message?: string) => {
    setState({ visible: true, kind, title, message });
  }, []);

  const showLoading = useCallback((title: string, message?: string) => {
    present('loading', title, message);
  }, [present]);

  const showProcessing = useCallback((title: string, message?: string) => {
    present('processing', title, message);
  }, [present]);

  const showSuccess = useCallback((title: string, message?: string, autoHideMs = 1500) => {
    present('success', title, message);
    if (autoHideMs > 0) {
      setTimeout(() => {
        setState((current) => (current.visible && current.kind === 'success' ? { ...current, visible: false } : current));
      }, autoHideMs);
    }
  }, [present]);

  const showError = useCallback((title: string, message?: string) => {
    present('error', title, message);
  }, [present]);

  const value = useMemo(() => ({ showLoading, showProcessing, showSuccess, showError, hideFeedback }), [showLoading, showProcessing, showSuccess, showError, hideFeedback]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Modal visible={state.visible} transparent animationType="fade" onRequestClose={hideFeedback}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <View className="items-center">
              {state.kind === 'loading' || state.kind === 'processing' ? (
                <ActivityIndicator size="large" color="#0369a1" />
              ) : state.kind === 'success' ? (
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              ) : (
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
              )}

              <Text className="mt-4 text-center text-lg font-semibold text-waterbase-950">
                {state.title}
              </Text>
              {!!state.message && (
                <Text className="mt-2 text-center text-sm text-waterbase-600">
                  {state.message}
                </Text>
              )}
            </View>

            {state.kind === 'error' || state.kind === 'success' ? (
              <TouchableOpacity className="mt-5 rounded-lg bg-waterbase-500 py-3 items-center" onPress={hideFeedback}>
                <Text className="text-white font-semibold">Close</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }

  return context;
};