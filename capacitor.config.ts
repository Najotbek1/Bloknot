import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'uz.najotbek.bloknot',
  appName: 'Bloknot',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_bloknot',
      iconColor: '#4F46E5',
    },
  },
}

export default config
