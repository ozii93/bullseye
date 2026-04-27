import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Appbar, useTheme } from 'react-native-paper';

type AppHeaderProps = PropsWithChildren & {
  goBackNavigation?: () => void;
  withBack?: boolean;
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export const AppHeader = (props: AppHeaderProps) => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <Appbar.Header
      style={[
        {
          // paddingTop: (StatusBar.currentHeight ?? 0), // Sesuaikan untuk Android
          backgroundColor: theme.colors.background,
        },
        props.style]}
    >
      {props.withBack && (
        <Appbar.BackAction
          color={theme.colors.onSecondary}
          size={24}
          onPress={() =>
            props.goBackNavigation
              ? props.goBackNavigation()
              : navigation.goBack()
          }
        />
      )}
      {props.title && <Appbar.Content color={theme.colors.onSecondary} style={{alignItems: 'flex-start'}} title={props.title} titleStyle={{fontSize: 16, textAlign: 'left'}} />}
      {props.children}
    </Appbar.Header>
  );
};
