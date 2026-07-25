// ルートレイアウト。ナビゲーション構成（認証/停止/オンボーディング/タブ。05 §3.1）はM2で実装する。
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
