import React, { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type SectionLayoutProps = PropsWithChildren & {
  title?: string | React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  elevation?: number;
  horizontalPadding?: number; // padding kiri-kanan tambahan
};

export const SectionLayout = ({
  title,
  style,
  children,
  edges = ['left', 'right'],
  elevation = 0,
  horizontalPadding = 1, // default jarak 16px dari kiri-kanan
}: SectionLayoutProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={{
        flex: 0,
        paddingHorizontal: horizontalPadding,
      }}
    >
      <Surface style={[styles.container, style]} elevation={elevation as any}>
        {title ? (
          typeof title === 'string' ? (
            <View style={styles.titleWrapper}>
              <Text variant="titleMedium">{title}</Text>
              <View
                style={[
                  styles.titleUnderline,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
          ) : (
            title
          )
        ) : null}

        {children}
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  titleWrapper: {
    paddingVertical: 12,
  },
  titleUnderline: {
    width: '30%',
    height: 2,
    borderRadius: 10,
    marginTop: 4,
  },
});
