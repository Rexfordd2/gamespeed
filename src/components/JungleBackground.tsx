import { useTheme } from '../context/ThemeContext';
import { JungleThemeConfig } from '../types/theme';
import { jungleAssetManifest, jungleVisualFallbacks } from '../themes/assetManifest';

export const JungleBackground = () => {
  const { theme } = useTheme();
  const jungleTheme = theme as JungleThemeConfig;
  const { overlays } = jungleVisualFallbacks;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 ${jungleTheme.background.gradient}`} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.36) 100%), url(${jungleAssetManifest.ui.vignetteMask})`,
          backgroundSize: 'cover',
          opacity: 0.78,
        }}
      />
      
      {/* Top overlay */}
      <div 
        className="absolute top-0 left-0 right-0 h-48 bg-repeat-x"
        style={{
          backgroundImage: `${overlays.top}, url(${jungleTheme.background.overlay.top})`,
          backgroundSize: 'auto 100%'
        }}
      />

      {/* Left overlay */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-48 bg-repeat-y"
        style={{
          backgroundImage: `${overlays.left}, url(${jungleTheme.background.overlay.left})`,
          backgroundSize: '100% auto'
        }}
      />

      {/* Right overlay */}
      <div 
        className="absolute top-0 right-0 bottom-0 w-48 bg-repeat-y"
        style={{
          backgroundImage: `${overlays.right}, url(${jungleTheme.background.overlay.right})`,
          backgroundSize: '100% auto'
        }}
      />

      {/* Bottom overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48 bg-repeat-x"
        style={{
          backgroundImage: `${overlays.bottom}, url(${jungleTheme.background.overlay.bottom})`,
          backgroundSize: 'auto 100%'
        }}
      />
    </div>
  );
}; 