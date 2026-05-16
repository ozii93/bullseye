import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';

type SnackbarOptions = {
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type NotificationContextType = {
  showSnackbar: (message: string, options?: SnackbarOptions) => void;
  hideSnackbar: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<SnackbarOptions>({});

  const hideSnackbar = useCallback(() => {
    setVisible(false);
  }, []);

  const showSnackbar = useCallback((nextMessage: string, nextOptions: SnackbarOptions = {}) => {
    setMessage(nextMessage);
    setOptions(nextOptions);
    setVisible(true);
  }, []);

  const value = useMemo(
    () => ({
      showSnackbar,
      hideSnackbar,
    }),
    [hideSnackbar, showSnackbar],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideSnackbar}
        duration={options.duration ?? (options.actionLabel ? 7000 : 3500)}
        action={options.actionLabel ? {
          label: options.actionLabel,
          onPress: () => {
            hideSnackbar();
            options.onAction?.();
          },
        } : undefined}
        style={styles.snackbar}
      >
        {message}
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 24,
  },
});
