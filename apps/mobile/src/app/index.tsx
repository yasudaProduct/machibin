// M0プレースホルダ画面。SCR-01（起動・ログイン）以降の実装はM2で行う（05 画面設計書）。
import { StyleSheet, View } from 'react-native';

import { Greeting } from '@/components/greeting';

export default function Index() {
  return (
    <View style={styles.container}>
      <Greeting />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
