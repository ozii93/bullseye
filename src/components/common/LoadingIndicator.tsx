import React from 'react';
import { ActivityIndicator, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type LoadingIndicatorProps = {
  hasMoreClick?: () => void;
  hasMore?: boolean;
  visible: boolean;
  color?: string;
};

export const LoadingIndicator = ({
  hasMoreClick,
  hasMore,
  visible,
  color,
}: LoadingIndicatorProps) => {
  const theme = useTheme();

  if (visible) {
    return (
      <ActivityIndicator
        size="small"
        color={color || theme.colors.primary}
        style={styles.loader}
      />
    );
  }

  if (hasMore) {
    return (
      <TouchableWithoutFeedback onPress={hasMoreClick}>
        <Text
          variant="labelSmall"
          style={[styles.moreText, { color: theme.colors.primary }]}
        >
          Muat Lebih Banyak
        </Text>
      </TouchableWithoutFeedback>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  loader: {
    padding: 8,
  },
  moreText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
