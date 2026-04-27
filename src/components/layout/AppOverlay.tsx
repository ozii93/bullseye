import { PropsWithChildren } from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import { useTheme } from 'react-native-paper'

export const AppOverlay = (
  props: PropsWithChildren & {
    onPress?: () => void
    style?: StyleProp<ViewStyle>
  }
) => {
  const theme = useTheme()

  return (
    <TouchableWithoutFeedback
      onPress={props.onPress}
      style={[
        StyleSheet.absoluteFill,
        props.style,
        {
          flex: 1,
          zIndex: 10,
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.colors.backdrop,
            zIndex: -1,
          },
        ]}
      ></View>
      {props.children}
    </TouchableWithoutFeedback>
  )
}
