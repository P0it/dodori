const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// forceWriteFileSystem: RN 0.86 Metro의 내부 API 변경으로 css-interop 가상 FS 패치가
// 깨져서(getSha1 undefined) 디스크 기록 모드로 우회
module.exports = withNativeWind(config, {
  input: './src/global.css',
  forceWriteFileSystem: true,
});
