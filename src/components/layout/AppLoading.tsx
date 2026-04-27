import { ActivityIndicator, Platform } from 'react-native'
import { AppOverlay } from './AppOverlay'
import { SIZES } from '../../core/theme'
import { useTheme } from 'react-native-paper'

export const AppLoading = () => {
  const isLoading = false
  const theme = useTheme()

  if (isLoading) {
    return (
      <AppOverlay
        style={{
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          style={{
            zIndex: 999,
          }}
          color={theme.colors.primary}
          size={
            Platform.OS === 'android'
              ? SIZES.width / 8
              : 'large'
          }
        />
      </AppOverlay>
    )
  }
}
