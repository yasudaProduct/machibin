// L1'（jest-expo＋React Native Testing Library）のパイプライン疎通用テスト（13 §2.1）
// RNTL v14ではrenderがPromiseを返すため、必ずawaitする。
import { render, screen } from '@testing-library/react-native';

import { Greeting } from './greeting';

test('プレースホルダ文言を表示する', async () => {
  await render(<Greeting />);
  expect(screen.getByText(/まちびん/)).toBeTruthy();
});
